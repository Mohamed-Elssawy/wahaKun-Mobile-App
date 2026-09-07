import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';

import { communityApi } from '../services';

import type { Comment } from '../types';

const LOAD_ERROR = 'تعذر تحميل التعليقات';

const PAGE_SIZE = 10;

/** F-04's thread. Its own hook so a failed thread never takes the diagnosis with it. */
export function useIssueComments(issueId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const page = useRef(1);
  const isMounted = useRef(true);

  // Its own empty dependency list: lifetime is a separate question from which load is live.
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await communityApi.getComments(issueId, 1, PAGE_SIZE);
      if (isMounted.current) {
        page.current = 1;
        setComments(result.comments);
        setTotal(result.total);
        setHasMore(result.hasMore);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(describeError(err, LOAD_ERROR));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [issueId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoadingMore || isLoading) {
      return;
    }
    setIsLoadingMore(true);

    try {
      const next = page.current + 1;
      const result = await communityApi.getComments(issueId, next, PAGE_SIZE);

      if (isMounted.current) {
        page.current = next;
        // Deduped by id: a comment posted between pages would otherwise arrive twice.
        setComments(current => {
          const seen = new Set(current.map(comment => comment.id));
          return [...current, ...result.comments.filter(c => !seen.has(c.id))];
        });
        setHasMore(result.hasMore);
      }
    } catch {
      // A failed page is not a failed thread; what is already listed stays readable.
      if (isMounted.current) {
        setHasMore(false);
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingMore(false);
      }
    }
  }, [issueId, hasMore, isLoadingMore, isLoading]);

  return {
    comments,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    retry: load,
  };
}
