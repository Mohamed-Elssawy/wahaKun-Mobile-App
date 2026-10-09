import { useCallback, useEffect, useRef, useState } from 'react';

import { ENABLE_COMMENT_POSTING } from '@/config/env';
import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';

import { communityApi } from '../services';

import type { Comment } from '../types';

const LOAD_ERROR = 'تعذر تحميل التعليقات';
const POST_ERROR = 'تعذر إرسال التعليق، حاول مرة أخرى';

const PAGE_SIZE = 10;

/** F-04's thread. Its own hook so a failed thread never takes the diagnosis with it. */
export function useIssueComments(issueId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<ReportError | null>(null);

  const page = useRef(1);
  /** Ids appended since the last load, by post() or by the hub; read synchronously to dedupe. */
  const appended = useRef(new Set<string>());
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
        appended.current = new Set();
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

  // Other farmers' comments, live. The poster's own comment arrives here too, after post() has
  // already appended it, so both paths dedupe by id and the hub's count is the one kept.
  useEffect(
    () =>
      communityApi.subscribeToIssue(issueId, event => {
        if (!isMounted.current) {
          return;
        }
        if (event.type === 'commentAdded') {
          if (!appended.current.has(event.comment.id)) {
            appended.current.add(event.comment.id);
            setComments(current =>
              current.some(comment => comment.id === event.comment.id)
                ? current
                : [...current, event.comment],
            );
          }
          setTotal(event.total);
        } else if (event.type === 'commentDeleted') {
          setComments(current => current.filter(comment => comment.id !== event.commentId));
          setTotal(event.total);
        }
      }),
    [issueId],
  );

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

  /**
   * Not optimistic, unlike a vote: the hub runs the text past moderation and can reject it,
   * so showing the comment first would mean pulling it back out in front of the farmer.
   */
  const post = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || isPosting) {
        return false;
      }

      setIsPosting(true);
      setPostError(null);

      try {
        const comment = await communityApi.postComment(issueId, trimmed);
        if (isMounted.current) {
          // Appended rather than reloaded: a reload would lose every page already scrolled.
          // Skipped when the hub's broadcast of this same comment got here first.
          if (!appended.current.has(comment.id)) {
            appended.current.add(comment.id);
            setComments(current => [...current, comment]);
            setTotal(current => current + 1);
          }
        }
        return true;
      } catch (err) {
        if (isMounted.current) {
          setPostError(describeError(err, POST_ERROR));
        }
        return false;
      } finally {
        if (isMounted.current) {
          setIsPosting(false);
        }
      }
    },
    [issueId, isPosting],
  );

  return {
    comments,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    retry: load,
    post,
    isPosting,
    postError,
    dismissPostError: () => setPostError(null),
    /** Off until the moderation service on :8000 is reachable; the composer renders disabled. */
    canPost: ENABLE_COMMENT_POSTING,
  };
}
