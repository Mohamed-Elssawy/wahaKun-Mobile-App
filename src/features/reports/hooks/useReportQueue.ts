import { useEffect, useMemo, useState } from 'react';

import {
  discardQueuedReport,
  drainQueue,
  getQueueSnapshot,
  retryQueuedReport,
  subscribeToQueue,
} from '../services/reportQueue';

/** Reads the queue. The service owns the state; this only mirrors it into React. */
export function useReportQueue() {
  const [snapshot, setSnapshot] = useState(getQueueSnapshot);

  useEffect(() => {
    const unsubscribe = subscribeToQueue(setSnapshot);
    // Hydration can land before this effect, and that update would reach no subscriber.
    setSnapshot(getQueueSnapshot());
    return unsubscribe;
  }, []);

  const { items, isOnline } = snapshot;

  return useMemo(
    () => ({
      queued: items,
      isOnline,
      isSending: items.some(item => item.state === 'uploading'),
      /** Excludes failures: those need a decision, not waiting. */
      waitingCount: items.filter(item => item.state !== 'failed').length,
      failedCount: items.filter(item => item.state === 'failed').length,
      sendNow: drainQueue,
      retry: retryQueuedReport,
      discard: discardQueuedReport,
    }),
    [items, isOnline],
  );
}
