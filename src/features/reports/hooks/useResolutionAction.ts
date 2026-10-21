import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '../errors';
import { attempt } from '../lifecycle';
import { reportApi } from '../services';

import type { ReportError } from '../errors';
import type { LifecycleFacts, RefusalCode } from '../lifecycle';

const ACTION_ERROR = 'تعذر إرسال الإجراء، حاول مرة أخرى';

/** Takes a facts getter, not a value, so a list row reads its own report at tap time. */
export function useResolutionAction(reportId: string, getFacts: () => LifecycleFacts) {
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<ReportError | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const act = useCallback(
    async (event: 'farmerConfirms' | 'farmerRejects'): Promise<RefusalCode | null> => {
      const result = attempt({ event, actor: 'farmer', facts: getFacts() });
      if (!result.ok) {
        return result.refusal;
      }

      setIsActing(true);
      setActionError(null);

      try {
        if (event === 'farmerConfirms') {
          await reportApi.confirmResolution(reportId);
        } else {
          await reportApi.rejectResolution(reportId);
        }
        return null;
      } catch (err) {
        if (isMounted.current) {
          setActionError(describeError(err, ACTION_ERROR));
        }
        return null;
      } finally {
        if (isMounted.current) {
          setIsActing(false);
        }
      }
    },
    [reportId, getFacts],
  );

  return {
    confirm: () => act('farmerConfirms'),
    reject: () => act('farmerRejects'),
    isActing,
    actionError,
  };
}
