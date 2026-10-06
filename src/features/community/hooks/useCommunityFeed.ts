import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { getErrorMessage } from '@/api';
import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';

import { communityApi } from '../services';

import type { FeedPost, FeedSeverity, FeedSort, FeedTab } from '../types';

const LOAD_ERROR = 'تعذر تحميل المجتمع، حاول مرة أخرى';

const PAGE_SIZE = 10;

/** Every axis F-01 filters on. One object, so a change to any of them is one reload. */
type FeedFilters = {
  tab: FeedTab;
  severities: readonly FeedSeverity[];
  nearbyOnly: boolean;
  sort: FeedSort;
};

// Severity first, matching the ترتيب chip's default label on the frame.
const INITIAL: FeedFilters = {
  tab: 'all',
  severities: [],
  nearbyOnly: false,
  sort: 'severity',
};

export function useCommunityFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [filters, setFilters] = useState<FeedFilters>(INITIAL);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const page = useRef(1);
  const isFocused = useRef(true);
  /** Guards against a filter change landing after a slower request for the old one. */
  const requestId = useRef(0);
  const { location } = useCurrentLocation();

  const load = useCallback(
    async (next: FeedFilters, isRefresh = false): Promise<void> => {
      const request = ++requestId.current;

      setError(null);
      if (isRefresh) {
        setIsRefreshing(true);
      }

      try {
        const result = await communityApi.getFeed({
          page: 1,
          pageSize: PAGE_SIZE,
          ...next,
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

  /**
   * Refetches on focus, and again whenever the filters change: a report filed seconds ago
   * belongs at the top of the feed, and a filter change is a different first page.
   */
  // Depending on `filters` here is what loads a new filter, so the setters do not also call
  // load() - doing both fired every query twice.
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      load(filters);

      // Runs on blur as well as unmount, so a slow response cannot set state after.
      return () => {
        isFocused.current = false;
      };
    }, [load, filters]),
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
        ...filters,
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
  }, [hasMore, isLoadingMore, isLoading, error, filters, location]);

  // Clears the list as well as setting the flag, so a wider filter's rows cannot sit under a
  // narrower one's spinner and read as results.
  const applyFilters = useCallback((update: (current: FeedFilters) => FeedFilters) => {
    setFilters(update);
    setIsLoading(true);
    setPosts([]);
  }, []);

  const changeTab = useCallback(
    (tab: FeedTab) => applyFilters(current => ({ ...current, tab })),
    [applyFilters],
  );

  const changeSort = useCallback(
    (sort: FeedSort) => applyFilters(current => ({ ...current, sort })),
    [applyFilters],
  );

  const toggleNearby = useCallback(
    () => applyFilters(current => ({ ...current, nearbyOnly: !current.nearbyOnly })),
    [applyFilters],
  );

  /** Chips union rather than replace: turning on حرجة must not turn off متوسطة. */
  const toggleSeverity = useCallback(
    (severity: FeedSeverity) =>
      applyFilters(current => ({
        ...current,
        severities: current.severities.includes(severity)
          ? current.severities.filter(existing => existing !== severity)
          : [...current.severities, severity],
      })),
    [applyFilters],
  );

  const patchPost = useCallback((issueId: string, change: Partial<FeedPost>) => {
    setPosts(current =>
      current.map(post => (post.issueId === issueId ? { ...post, ...change } : post)),
    );
  }, []);

  /** Optimistic: flips the card at once, then settles on the server's count (or rolls back). */
  const toggleConfirmation = useCallback(
    async (issueId: string): Promise<string | null> => {
      const updatePost = (update: (post: FeedPost) => FeedPost) =>
        setPosts(current =>
          current.map(post => (post.issueId === issueId ? update(post) : post)),
        );

      let previous: FeedPost | undefined;
      updatePost(post => {
        previous = post;
        const hasConfirmed = !post.hasConfirmed;
        return {
          ...post,
          hasConfirmed,
          confirmations: Math.max(0, post.confirmations + (hasConfirmed ? 1 : -1)),
        };
      });

      try {
        const result = await communityApi.toggleConfirmation(issueId);
        updatePost(post => ({
          ...post,
          hasConfirmed: result.hasVoted,
          confirmations: result.voteCount,
        }));
        return null;
      } catch (err) {
        if (previous) {
          const original = previous;
          updatePost(() => original);
        }
        return getErrorMessage(err, 'تعذر تسجيل التأكيد، حاول مرة أخرى');
      }
    },
    [],
  );

  const share = useCallback(
    async (issueId: string): Promise<void> => {
      const bump = (delta: number) =>
        setPosts(current =>
          current.map(post =>
            post.issueId === issueId
              ? { ...post, shareCount: post.shareCount + delta }
              : post,
          ),
        );

      bump(1);

      try {
        patchPost(issueId, { shareCount: await communityApi.shareIssue(issueId) });
      } catch {
        bump(-1);
      }
    },
    [patchPost],
  );

  return {
    posts,
    ...filters,
    changeTab,
    changeSort,
    toggleNearby,
    toggleSeverity,
    share,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    refresh: () => load(filters, true),
    toggleConfirmation,
    loadMore,
    retry: () => load(filters),
    /** Empty under a filter is X-06; empty with none is a first-use feed. */
    isEmpty: !isLoading && !error && posts.length === 0,
    /** True when anything narrows the feed, which is what picks the empty copy. */
    isFiltered:
      filters.tab !== 'all' || filters.severities.length > 0 || filters.nearbyOnly,
    origin: location,
  };
}
