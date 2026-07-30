import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '../errors';
import { reportApi } from '../services';

import type { ReportError } from '../errors';
import type { Report } from '../types';

/** Every failure reads the same to the farmer: it did not load, try again. */
const LOAD_ERROR = 'تعذر تحميل التشخيص، حاول مرة أخرى';

/** Takes an id, not a report: params stay serialisable and F-04 can route here cold. */
export function useReportDiagnosis(reportId: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  // True from the start, so the first frame is the spinner and not an empty screen.
  const [isLoading, setIsLoading] = useState(true);
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
      const result = await reportApi.getReportById(reportId);

      // The read takes a moment and back is always there, so this can land after leaving.
      if (isMounted.current) {
        setReport(result);
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

  return { report, error, isLoading, retry: load };
}
