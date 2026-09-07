import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { useCurrentLocation } from '@/features/reports/hooks/useCurrentLocation';

import { communityApi } from '../services';

import type { FeedFilter, FeedPost } from '../types';

const LOAD_ERROR = 'تعذر تحميل المجتمع، حاول مرة أخرى';

const PAGE_SIZE = 10;

export function useCommunityFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const page = useRef(1);
  const isFocused = useRef(true);
  /** Guards against a filter change landing after a slower request for the old one. */
  const requestId = useRef(0);
  const location = useCurrentLocation();

  const load = useCallback(
    async (nextFilter: FeedFilter, isRefresh = false): Promise<void> => {
      const request = ++requestId.current;

      setError(null);
      if (isRefresh) {
        setIsRefreshing(true);
      }

      try {
        const result = await communityApi.getFeed({
          page: 1,
          pageSize: PAGE_SIZE,
          filter: nextFilter,
          origin: location ?? undefined,
        });

        // A newer request has already been fired, so this answer is stale.
        if (!isFocused.current || request !== requestId.current) {
          return;
        }

        page.current = 1;
        setPosts(result.posts);
        setHasMore(result.hasMore);
      } catch (err) {
        if (isFocused.current && request === requestId.current) {
          setError(describeError(err, LOAD_ERROR));
        }
      } finally {
        if (isFocused.current && request === requestId.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [location],
  );

  /** Refetches on focus: a report filed seconds ago belongs at the top of the feed. */
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      load(filter);

      // Runs on blur as well as unmount, so a slow response cannot set state after.
      return () => {
        isFocused.current = false;
      };
    }, [load, filter]),
  );

  const loadMore = useCallback(async (): Promise<void> => {
    // Guarded on every one: a fast scroll fires onEndReached repeatedly.
    if (!hasMore || isLoadingMore || isLoading || error) {
      return;
    }

    const request = requestId.current;
    setIsLoadingMore(true);

    try {
      const next = page.current + 1;
      const result = await communityApi.getFeed({
        page: next,
        pageSize: PAGE_SIZE,
        filter,
        origin: location ?? undefined,
      });

      if (!isFocused.current || request !== requestId.current) {
        return;
      }

      page.current = next;
      // Deduped by id: a post filed between pages would otherwise arrive twice.
      setPosts(current => {
        const seen = new Set(current.map(post => post.issueId));
        return [...current, ...result.posts.filter(post => !seen.has(post.issueId))];
      });
      setHasMore(result.hasMore);
    } catch {
      // A failed page is not a failed feed; what is already listed stays readable.
      if (isFocused.current) {
        setHasMore(false);
      }
    } finally {
      if (isFocused.current) {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, isLoading, error, filter, location]);

  const changeFilter = useCallback(
    (next: FeedFilter) => {
      setFilter(next);
      setIsLoading(true);
      setPosts([]);
      load(next);
    },
    [load],
  );

  return {
    posts,
    filter,
    changeFilter,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    refresh: () => load(filter, true),
    loadMore,
    retry: () => load(filter),
    /** Empty under a filter is X-06; empty with no filter is a first-use feed. */
    isEmpty: !isLoading && !error && posts.length === 0,
    origin: location,
  };
}
