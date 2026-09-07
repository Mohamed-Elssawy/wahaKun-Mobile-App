import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';

import { describeError } from '../errors';
import { reportApi } from '../services';
import { isCriticalSeverity } from '../severity';
import { isResolvedStatus } from '../status';
import { useReportQueue } from './useReportQueue';

import type { ReportError } from '../errors';
import type { Report, ReportListItem } from '../types';

const LOAD_ERROR = 'تعذر تحميل البلاغات، حاول مرة أخرى';

export type ReportFilter = 'all' | 'active' | 'resolved' | 'critical';

/** One SectionList section. The title is copy, so it is decided here, not in the UI. */
export type ReportSection = { title: string; data: ReportListItem[] };

// resolved finally answers something: IssueStatus has Repaired and completed.
const MATCHES: Record<ReportFilter, (report: Report) => boolean> = {
  all: () => true,
  active: report => !isResolvedStatus(report.status),
  resolved: report => isResolvedStatus(report.status),
  // `!= null`, not `!== undefined`: the server sends null for an unanalysed report.
  critical: report =>
    report.analysis != null && isCriticalSeverity(report.analysis.severity),
};

/** Refetches on focus: a report filed seconds ago is the reason to open this tab. */
export function useMyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ReportFilter>('all');
  const isFocused = useRef(true);
  const { queued, retry, discard } = useReportQueue();

  const load = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const result = await reportApi.getMyReports();
      if (isFocused.current) {
        setReports(result);
      }
    } catch (err) {
      if (isFocused.current) {
        setError(describeError(err, LOAD_ERROR));
      }
    } finally {
      if (isFocused.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      load();

      // Runs on blur as well as unmount, so a slow response cannot set state after.
      return () => {
        isFocused.current = false;
      };
    }, [load]),
  );

  // Queued reports count as active, never critical or resolved: neither is known yet.
  const counts = useMemo(
    () =>
      ({
        all: reports.length + queued.length,
        active: reports.filter(MATCHES.active).length + queued.length,
        resolved: reports.filter(MATCHES.resolved).length,
        critical: reports.filter(MATCHES.critical).length,
      }) satisfies Record<ReportFilter, number>,
    [reports, queued],
  );

  /** Queued reports lead and ignore the filter, since 'critical' needs an analysis they lack. */
  const sections = useMemo<ReportSection[]>(() => {
    const result: ReportSection[] = [];

    // Its own section per X-09: "waiting on your phone" and "filed" are different answers.
    if (queued.length > 0) {
      result.push({
        title: 'محفوظ على جهازك',
        data: queued.map(item => ({ kind: 'queued' as const, queued: item })),
      });
    }

    const visible = reports.filter(MATCHES[filter]);
    if (visible.length > 0) {
      result.push({
        title: 'البلاغات النشطة',
        data: visible.map(item => ({ kind: 'server' as const, report: item })),
      });
    }

    return result;
  }, [queued, reports, filter]);

  return {
    /** Already filtered, grouped and ordered, so the screen renders without deciding. */
    sections,
    /** Nothing to show under the current filter, which picks between X-06 and X-07. */
    isEmpty: sections.length === 0,
    /** Whether the farmer has ever filed a report, which picks the empty state. */
    hasAnyReports: reports.length > 0 || queued.length > 0,
    counts,
    filter,
    setFilter,
    isLoading,
    error,
    refresh: load,
    retryQueued: retry,
    discardQueued: discard,
  };
}
