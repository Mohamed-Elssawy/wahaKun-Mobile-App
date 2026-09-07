import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  discardQueuedReport,
  drainQueue,
  getDeliveredReportId,
  getQueueSnapshot,
  retryQueuedReport,
  subscribeToQueue,
} from '../services/reportQueue';

import type { ReportError } from '../errors';

const FAILURE_MESSAGES: Record<string, string> = {
  offline: 'تحقق من اتصالك وحاول مرة أخرى',
  unauthorized: 'انتهت جلستك، سجّل الدخول مرة أخرى',
  unrecognized: 'لم نتمكن من رؤية مشكلة واضحة في الصورة',
  tooMinor: 'المشكلة تبدو بسيطة، ولا يحتاج هذا البلاغ إلى متابعة',
  unknown: 'تعذر إرسال البلاغ، حاول مرة أخرى',
};

/** Where one submitted report has got to. The screen picks a design from this. */
export type SubmissionState =
  /** analyze or create is in flight. X-02. */
  | { kind: 'working' }
  /** Filed. The only state with somewhere to navigate. */
  | { kind: 'delivered'; reportId: string }
  /** Stored and waiting on a connection. X-02a. */
  | { kind: 'saved' }
  /** Stopped for a reason retrying will not change. F-03c and its siblings. */
  | { kind: 'failed'; error: ReportError };

/** Watches one queued report through analyze and create. Takes a localId: no report id exists yet. */
export function useReportSubmission(localId: string) {
  const [snapshot, setSnapshot] = useState(getQueueSnapshot);

  useEffect(() => {
    const unsubscribe = subscribeToQueue(setSnapshot);
    // Hydration can land before this effect, and that update would reach no subscriber.
    setSnapshot(getQueueSnapshot());
    return unsubscribe;
  }, []);

  const state = useMemo<SubmissionState>(() => {
    const item = snapshot.items.find(queued => queued.localId === localId);

    // Gone from the queue means the drain dropped it, which only happens after create.
    if (!item) {
      const reportId = getDeliveredReportId(localId);
      return reportId
        ? { kind: 'delivered', reportId }
        : {
            kind: 'failed',
            error: { kind: 'unknown', message: FAILURE_MESSAGES.unknown },
          };
    }

    if (item.state === 'failed') {
      const kind = item.failureKind ?? 'unknown';
      return { kind: 'failed', error: { kind, message: FAILURE_MESSAGES[kind] } };
    }

    // A backed-off item has already tried and lost the network, so it is not still working.
    if (!snapshot.isOnline || item.attempts > 0) {
      return { kind: 'saved' };
    }

    return { kind: 'working' };
  }, [snapshot, localId]);

  const retry = useCallback(() => {
    retryQueuedReport(localId);
  }, [localId]);

  /** Every exit off F-03c drops the report: a refused photo can never resolve. */
  const discard = useCallback(() => {
    discardQueuedReport(localId);
  }, [localId]);

  return { state, retry, discard, sendNow: drainQueue };
}
