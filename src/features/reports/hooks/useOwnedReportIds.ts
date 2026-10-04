import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { reportApi } from '../services';

/**
 * F-05's peek branches on ownership, but MapResponseDto carries no reporterId (same gap
 * BACKEND-BLOCKERS.md already documents for the community feed) - so the map cannot answer
 * "is this mine" on its own. This cross-references the farmer's own report list instead, the
 * same move useIssueDetails makes for F-04. A Set, not the reports themselves: the map only
 * ever needs membership.
 */
export function useOwnedReportIds() {
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const isFocused = useRef(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      const result = await reportApi.getMyReports();
      if (isFocused.current) {
        setOwnedIds(new Set(result.map(report => report.id)));
      }
    } catch {
      // A failed join fails closed to "not owned", same as isReportOwner on F-04: the farmer
      // sees the public CTA instead of the private one, never a crash over this.
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

  return ownedIds;
}
