import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '../errors';
import { reportApi } from '../services';

import type { ReportError } from '../errors';
import type { Report } from '../types';

/** Two problems for us, one fact for the farmer: it did not work, try again. */
const ANALYSIS_ERROR = 'تعذر تحليل البلاغ، حاول مرة أخرى';

/** Fires on mount and on retry. Returns state; the screen decides where it leads. */
export function useReportAnalysis(reportId: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  // True from the start: effects run after first render, so false paints a blank frame.
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const isMounted = useRef(true);

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
      const result = await reportApi.analyzeReport(reportId);

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
        setError(describeError(err, ANALYSIS_ERROR));
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

  return { report, error, isAnalyzing, retry: runAnalysis };
}
