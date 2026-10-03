import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';

import { describeError } from '../errors';
import { isClosedWireStatus } from '../lifecycle';
import { reportApi } from '../services';
import { isCriticalSeverity } from '../severity';
import { useReportQueue } from './useReportQueue';

import type { ReportError } from '../errors';
import type { Report, ReportListItem, ReportTrackerDetails } from '../types';

const LOAD_ERROR = 'تعذر تحميل البلاغات، حاول مرة أخرى';

export type ReportFilter = 'all' | 'active' | 'resolved' | 'critical';

/** One SectionList section. The title is copy, so it is decided here, not in the UI. */
export type ReportSection = { title: string; data: ReportListItem[] };

/** The server-report section heading follows the filter, so it never mislabels resolved as active. */
const SECTION_TITLE: Record<ReportFilter, string> = {
  all: 'كل البلاغات',
  active: 'البلاغات النشطة',
  resolved: 'البلاغات التي تم حلها',
  critical: 'البلاغات الحرجة',
};

// resolved finally answers something: IssueStatus has Repaired and completed.
const MATCHES: Record<ReportFilter, (report: Report) => boolean> = {
  all: () => true,
  active: report => !isClosedWireStatus(report.status),
  resolved: report => isClosedWireStatus(report.status),
  // `!= null`, not `!== undefined`: the server sends null for an unanalysed report.
  critical: report =>
    report.analysis != null && isCriticalSeverity(report.analysis.severity),
};

/** Refetches on focus: a report filed seconds ago is the reason to open this tab. */
export function useMyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  // F-07's contextual slot (§8.2): keyed by report id, loaded only for the reports that are
  // still open - a closed card draws no slot, so there is nothing to fetch for it.
  const [trackers, setTrackers] = useState<Record<string, ReportTrackerDetails>>({});
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

      const active = result.filter(report => !isClosedWireStatus(report.status));
      const loadedTrackers = await Promise.all(
        active.map(report =>
          reportApi
            .getReportTracker(report.id)
            .then(details => [report.id, details] as const)
            .catch(() => null),
        ),
      );

      if (isFocused.current) {
        setTrackers(
          Object.fromEntries(
            loadedTrackers.filter(
              (entry): entry is [string, ReportTrackerDetails] => entry != null,
            ),
          ),
        );
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
        title: SECTION_TITLE[filter],
        data: visible.map(item => ({ kind: 'server' as const, report: item })),
      });
    }

    return result;
  }, [queued, reports, filter]);

  return {
    /** Already filtered, grouped and ordered, so the screen renders without deciding. */
    sections,
    trackers,
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
