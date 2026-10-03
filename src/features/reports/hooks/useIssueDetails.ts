import { useCallback, useEffect, useRef, useState } from 'react';

import { communityApi } from '@/features/community/services';
import { isServerIssueId } from '@/features/community/services/communityService';
import type { FeedPost } from '@/features/community/types';
import { getMapIssueById } from '@/features/map/services/mapService';
import type { MapIssue } from '@/features/map/types';

import { describeError } from '../errors';
import { reportApi } from '../services';

import type { ReportError } from '../errors';
import type { Report } from '../types';

const LOAD_ERROR = 'تعذر تحميل البلاغ، حاول مرة أخرى';

/** Everything a map row can tell us. No analysis: MapResponseDto carries none. */
function fromMapIssue(issue: MapIssue): Report {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    createdAt: issue.createdAt,
    // The map does not say who filed it, and inventing an id would be worse than none.
    reporterId: '',
    latitude: issue.latitude,
    longitude: issue.longitude,
    attachments: issue.photoUrl
      ? [
          {
            id: `${issue.id}-photo`,
            type: 'Photo',
            url: issue.photoUrl,
            createdAt: issue.createdAt,
          },
        ]
      : [],
  };
}

/** A seeded feed card, which the map has never heard of. */
function fromFeedPost(post: FeedPost): Report {
  return {
    id: post.issueId,
    title: post.title,
    description: post.description,
    status: post.status,
    createdAt: post.createdAt,
    reporterId: post.reporterId ?? '',
    latitude: post.latitude,
    longitude: post.longitude,
    attachments: post.photoUrl
      ? [
          {
            id: `${post.issueId}-photo`,
            type: 'Photo',
            url: post.photoUrl,
            createdAt: post.createdAt,
          },
        ]
      : [],
  };
}

/** Not a Guid means a seeded feed card; asking the map for it is a guaranteed 400. */
async function loadIssue(issueId: string): Promise<Report | null> {
  if (!isServerIssueId(issueId)) {
    const post = await communityApi.getPost(issueId);
    return post ? fromFeedPost(post) : null;
  }
  const issue = await getMapIssueById(issueId);
  return issue ? fromMapIssue(issue) : null;
}

/** Resolves an issue whoever filed it: the mirror holds this device's, the map answers for the rest. */
// A map row carries no diagnosis, which is why the screen treats a missing analysis as normal.
export function useIssueDetails(issueId: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  // True from the start, so the first frame is the spinner and not an empty screen.
  const [isLoading, setIsLoading] = useState(true);
  /** False when the row came from the map, which is what hides the full-diagnosis link. */
  const [isOwnReport, setIsOwnReport] = useState(false);
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
      const own = await reportApi.getReportById(issueId);
      if (isMounted.current) {
        setReport(own);
        setIsOwnReport(true);
        // This return skips the fallback's finally, so a report the mirror holds spun forever.
        setIsLoading(false);
      }
      return;
    } catch {
      // Not this device's report, which is the normal case from the feed.
    }

    try {
      const issue = await loadIssue(issueId);

      if (!isMounted.current) {
        return;
      }

      if (issue) {
        setReport(issue);
        setIsOwnReport(false);
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

  return { report, isOwnReport, error, isLoading, retry: load };
}
