import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';

import { communityApi } from '../services';

import type { IssueDetails } from '../types';

const LOAD_ERROR = 'تعذر تحميل بيانات البلاغ';

/**
 * F-04's community half: who filed it, how far away, the counters, and the recording.
 *
 * Its own hook beside useIssueDetails and useIssueComments, rather than folded into either,
 * because the three answer from different services and a failure in one must leave the other
 * two on screen. The diagnosis is worth reading even when nobody's name loaded.
 */
export function useIssueContext(issueId: string) {
  const [issue, setIssue] = useState<IssueDetails | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const { location: origin } = useCurrentLocation();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await communityApi.getIssue(issueId);
      if (isMounted.current) {
        // Null is not an error: the feed simply does not list it, and F-04 still has a report.
        setIssue(result);
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

  const patch = useCallback((change: Partial<IssueDetails>) => {
    setIssue(current => (current ? { ...current, ...change } : current));
  }, []);

  /** Optimistic and self-inverse, the same as the feed card's: see useCommunityFeed. */
  const confirm = useCallback(async (): Promise<void> => {
    const flip = () =>
      setIssue(current =>
        current
          ? {
              ...current,
              hasConfirmed: !current.hasConfirmed,
              confirmations: current.confirmations + (current.hasConfirmed ? -1 : 1),
            }
          : current,
      );

    flip();

    try {
      patch(await communityApi.toggleConfirm(issueId));
    } catch {
      flip();
    }
  }, [issueId, patch]);

  const share = useCallback(async (): Promise<void> => {
    const bump = (delta: number) =>
      setIssue(current =>
        current ? { ...current, shareCount: current.shareCount + delta } : current,
      );

    bump(1);

    try {
      patch({ shareCount: await communityApi.shareIssue(issueId) });
    } catch {
      bump(-1);
    }
  }, [issueId, patch]);

  return { issue, origin, isLoading, error, retry: load, confirm, share };
}
