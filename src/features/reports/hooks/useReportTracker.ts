import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '../errors';
import { useResolutionAction } from './useResolutionAction';
import { reportApi } from '../services';
import { trackerFacts } from '../trackerFacts';
import { buildTrackerView } from '../trackerView';

import type { ReportError } from '../errors';
import type { Report, ReportTrackerDetails } from '../types';

const LOAD_ERROR = 'تعذر تحميل مسار البلاغ، حاول مرة أخرى';

/** F-06. Takes an id, not a report: the route param stays serialisable. */
export function useReportTracker(reportId: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [details, setDetails] = useState<ReportTrackerDetails | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  // Reads whatever `details` the closure holds at tap time, not whatever it held at render.
  const detailsRef = useRef<ReportTrackerDetails | null>(null);
  detailsRef.current = details;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const [loadedReport, loadedDetails] = await Promise.all([
        reportApi.getReportById(reportId),
        reportApi.getReportTracker(reportId),
      ]);

      if (isMounted.current) {
        setReport(loadedReport);
        setDetails(loadedDetails);
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
  }, [reportId]);

  useEffect(() => {
    load();
  }, [load]);

  const getFacts = useCallback(() => {
    // Only called from a tap the approval control's own visibility already gated on `details`
    // being loaded, so this is never reached with a null tracker.
    return trackerFacts(detailsRef.current as ReportTrackerDetails);
  }, []);

  const action = useResolutionAction(reportId, getFacts);

  const confirm = useCallback(async () => {
    const refusal = await action.confirm();
    if (!refusal) {
      await load();
    }
    return refusal;
  }, [action, load]);

  const reject = useCallback(async () => {
    const refusal = await action.reject();
    if (!refusal) {
      await load();
    }
    return refusal;
  }, [action, load]);

  const view = report && details ? buildTrackerView(report, details) : null;

  return {
    report,
    view,
    error,
    isLoading,
    retry: load,
    confirm,
    reject,
    isActing: action.isActing,
    actionError: action.actionError,
  };
}
