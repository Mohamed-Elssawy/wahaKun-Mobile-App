import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';

import { expertCtaFor } from '@/features/reports/lifecycle';
import type { ExpertCta } from '@/features/reports/lifecycle';

import { expertApi } from '../services';

import type { ExpertCaseSummary } from '../types';

/** MapResponseDto carries no assigned-expert id, so the two lists are joined here by reportId. */
export function useAssignedCaseCtas() {
  const [cases, setCases] = useState<ExpertCaseSummary[]>([]);
  const isFocused = useRef(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      const result = await expertApi.getAssignedCases();
      if (isFocused.current) {
        setCases(result);
      }
    } catch {
      // Fails closed to not assigned, so a failed second fetch reads as E-07 rather than crashing.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      load();

      return () => {
        isFocused.current = false;
      };
    }, [load]),
  );

  return useMemo(
    () =>
      new Map<string, ExpertCta>(
        cases.map(summary => [summary.reportId, expertCtaFor(summary)]),
      ),
    [cases],
  );
}
