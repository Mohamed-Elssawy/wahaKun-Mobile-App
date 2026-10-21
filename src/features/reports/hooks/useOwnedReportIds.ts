import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { reportApi } from '../services';

/** MapResponseDto carries no reporterId, so this cross-references the farmer's own list. */
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
      // A failed join fails closed to not owned: the farmer sees the public CTA, never a crash.
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
