import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';

import { describeError } from '../errors';
import { reportApi } from '../services';
import { CRITICAL_SEVERITIES } from '../severity';

import type { ReportError } from '../errors';
import type { Report } from '../types';

const LOAD_ERROR = 'تعذر تحميل البلاغات، حاول مرة أخرى';

export type ReportFilter = 'all' | 'active' | 'resolved' | 'critical';

// resolved is never true: no backend status means "fixed", and Dismissed is not it.
const MATCHES: Record<ReportFilter, (report: Report) => boolean> = {
  all: () => true,
  active: report => report.status !== 'Dismissed',
  resolved: () => false,
  critical: report =>
    report.analysis !== undefined &&
    CRITICAL_SEVERITIES.includes(report.analysis.severity),
};

/** Refetches on focus: a report filed seconds ago is the reason to open this tab. */
export function useMyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ReportFilter>('all');
  const isFocused = useRef(true);

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

  // Client-side because GetMyReports takes no parameters, and it keeps the counts honest.
  const counts = useMemo(
    () =>
      ({
        all: reports.length,
        active: reports.filter(MATCHES.active).length,
        resolved: reports.filter(MATCHES.resolved).length,
        critical: reports.filter(MATCHES.critical).length,
      }) satisfies Record<ReportFilter, number>,
    [reports],
  );

  const visible = useMemo(() => reports.filter(MATCHES[filter]), [reports, filter]);

  return {
    /** Already filtered, so the screen renders this without deciding anything. */
    reports: visible,
    /** Whether the farmer has ever filed a report, which picks the empty state. */
    hasAnyReports: reports.length > 0,
    counts,
    filter,
    setFilter,
    isLoading,
    error,
    refresh: load,
  };
}
