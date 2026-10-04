import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';

import { expertCtaFor } from '@/features/reports/lifecycle';
import type { ExpertCta } from '@/features/reports/lifecycle';

import { expertApi } from '../services';

import type { ExpertCaseSummary } from '../types';

/**
 * E-08's peek branches on assignment, but MapResponseDto carries neither an assigned-expert
 * id nor the node flags expertCtaFor needs - the same shape of gap useOwnedReportIds works
 * around for F-05. expertApi.getAssignedCases() already returns every field expertCtaFor
 * needs per case (it is what backs E-01), so this joins the two client-side by reportId
 * instead of asking the map to answer a question its wire format cannot.
 */
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
      // Fails closed to "not assigned", same as useOwnedReportIds: every pin reads as E-07's
      // public case rather than crashing the map over a failed second fetch.
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
    () => new Map<string, ExpertCta>(cases.map(summary => [summary.reportId, expertCtaFor(summary)])),
    [cases],
  );
}
