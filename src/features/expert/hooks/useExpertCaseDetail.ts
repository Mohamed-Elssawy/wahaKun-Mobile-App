import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';

import { expertApi } from '../services';

import type { ExpertCaseDetail } from '../types';

const LOAD_ERROR = 'تعذر تحميل الحالة';

/**
 * E-05/E-06's plain read. Both are a snapshot taken once at entry, never a subscription - §8.3
 * is explicit that a farmer rejection while the expert sits on E-05 produces no live update.
 */
export function useExpertCaseDetail(reportId: string) {
  const [detail, setDetail] = useState<ExpertCaseDetail | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await expertApi.getCaseDetail(reportId);
      if (isMounted.current) {
        setDetail(result);
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

  return { detail, error, isLoading, retry: load };
}
