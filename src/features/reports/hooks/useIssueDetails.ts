import { useCallback, useEffect, useRef, useState } from 'react';

import { communityApi } from '@/features/community/services';
import type { IssueDetails } from '@/features/community/types';
import { useIdentity } from '@/features/user/hooks/useIdentity';

import { describeError } from '../errors';
import { isReportOwner } from '../ownership';
import { reportApi } from '../services';

import type { ReportError } from '../errors';
import type { Report } from '../types';

const LOAD_ERROR = 'تعذر تحميل البلاغ، حاول مرة أخرى';

/** Everything the feed can tell us. No analysis: no read endpoint returns one. */
function fromIssueDetails(issue: IssueDetails): Report {
  return {
    id: issue.issueId,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    createdAt: issue.createdAt,
    // Empty on the real path, where MapResponseDto carries no reporterId. isReportOwner
    // fails closed on that, which is the point.
    reporterId: issue.reporterId ?? '',
    latitude: issue.latitude,
    longitude: issue.longitude,
    attachments: issue.photoUrl
      ? [
          {
            id: `${issue.issueId}-photo`,
            type: 'Photo',
            url: issue.photoUrl,
            createdAt: issue.createdAt,
          },
        ]
      : [],
  };
}

/** Resolves an issue whoever filed it: the mirror holds this device's, the feed answers for the rest. */
// Through communityApi rather than mapService directly, so both halves of F-04 read the same
// source and the one flag switches both. The real implementation still calls the map.
// A feed row carries no diagnosis, which is why the screen treats a missing analysis as normal.
export function useIssueDetails(issueId: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  // True from the start, so the first frame is the spinner and not an empty screen.
  const [isLoading, setIsLoading] = useState(true);
  /** True when the local mirror holds it, which only means this device filed it. */
  const [isMirrored, setIsMirrored] = useState(false);
  const isMounted = useRef(true);
  const { userId } = useIdentity();

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
      const own = await reportApi.getReportById(issueId);
      if (isMounted.current) {
        setReport(own);
        setIsMirrored(true);
        // This return skips the fallback's finally, so a report the mirror holds spun forever.
        setIsLoading(false);
      }
      return;
    } catch {
      // Not on this device, which is the normal case for anything opened from the feed.
    }

    try {
      const issue = await communityApi.getIssue(issueId);

      if (!isMounted.current) {
        return;
      }

      if (issue) {
        setReport(fromIssueDetails(issue));
        setIsMirrored(false);
      } else {
        setError({ kind: 'unknown', message: LOAD_ERROR });
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

  // Identity, not the mirror - see ownership.ts. Hiding the control is not the protection:
  // whatever F-06 calls must authorise the caller server-side too.
  const isOwnReport = isReportOwner(userId, report?.reporterId);

  return { report, isOwnReport, isMirrored, error, isLoading, retry: load };
}
