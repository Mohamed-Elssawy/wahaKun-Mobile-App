import { useCallback, useEffect, useRef, useState } from 'react';

import { describeAnalysisError } from '../errors';
import { reportApi } from '../services';

import type { ReportError } from '../errors';
import type { Report } from '../types';

/** Two problems for us, one fact for the farmer: it did not work, try again. */
const ANALYSIS_ERROR = 'تعذر تحليل البلاغ، حاول مرة أخرى';

/** Analysed already, so there is nothing for this screen to ask the model for. */
const isDiagnosed = (report: Report) =>
  report.analysis != null &&
  (report.status === 'Analyzed' || report.status === 'Escalated');

/** Fires on mount and on retry. Returns state; the screen decides where it leads. */
export function useReportAnalysis(reportId: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  // True from the start: effects run after first render, so false paints a blank frame.
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const isMounted = useRef(true);
  /** One delete per report, however many exits the farmer takes off F-03c. */
  const hasDiscarded = useRef(false);

  // Its own empty dependency list: lifetime is a separate question from which run is live.
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const runAnalysis = useCallback(async (): Promise<void> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Read first: the queue already analysed, and re-running would overwrite the answer.
      const existing = await reportApi.getReportById(reportId);
      const result = isDiagnosed(existing)
        ? existing
        : await reportApi.analyzeReport(reportId);

      // Analysis takes seconds and back is always there, so this can land after leaving.
      if (!isMounted.current) {
        return;
      }

      // Only these two are routable, and an unknown future status must read as failure.
      if (result.status === 'Analyzed' || result.status === 'Escalated') {
        setReport(result);
      } else {
        setError({ kind: 'unknown', message: ANALYSIS_ERROR });
      }
    } catch (err) {
      if (isMounted.current) {
        setError(describeAnalysisError(err, ANALYSIS_ERROR));
      }
    } finally {
      if (isMounted.current) {
        setIsAnalyzing(false);
      }
    }
  }, [reportId]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  /** A refused photo never gets an analysis, so left alone it sits in My Issues forever. */
  const discard = useCallback(() => {
    if (hasDiscarded.current) {
      return;
    }
    hasDiscarded.current = true;

    reportApi.deleteReport(reportId).catch(() => {
      // Offline, or already gone. Neither is something the farmer can act on.
    });
  }, [reportId]);

  return { report, error, isAnalyzing, retry: runAnalysis, discard };
}
