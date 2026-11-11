import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';

import { communityApi } from '../services';

import type { IssueDetails } from '../types';

const LOAD_ERROR = 'تعذر تحميل بيانات البلاغ';

/** Its own hook: the three services fail independently, so one failure leaves the others up. */
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

  // Every event carries the server's new total, so a missed event heals on the next one.
  useEffect(
    () =>
      communityApi.subscribeToIssue(issueId, event => {
        if (!isMounted.current) {
          return;
        }
        if (event.type === 'votes') {
          patch(
            event.byMe
              ? { confirmations: event.count, hasConfirmed: event.voted }
              : { confirmations: event.count },
          );
        } else if (event.type === 'shares') {
          patch({ shareCount: event.count });
        } else {
          patch({ commentCount: event.total });
        }
      }),
    [issueId, patch],
  );

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

  return { issue, origin, isLoading, error, retry: load, share };
}
