import { useCallback, useEffect, useRef, useState } from 'react';

import type { Locale } from '@/i18n';
import { onRelaunchRequired, relaunchApp } from '@/i18n/relaunch';
import type { RelaunchFailure } from '@/i18n/relaunch';

/** A judgement call, not measured data: `restart()` returns before teardown finishes, so this is a bounded guess at it. */
const RESTART_TIMEOUT_MS = 2000;

export type Relaunch = {
  /** The locale being switched to; also doubles as "is a relaunch required" since the two can't disagree. */
  target: Locale | null;
  /** Which of the two ways the restart failed, or null while it may still succeed. */
  failure: RelaunchFailure | null;
  restart: () => void;
};

/** Owns the flag that swaps in the relaunch screen above the navigator; mounted once in app/App.tsx. */
export function useRelaunch(): Relaunch {
  const [target, setTarget] = useState<Locale | null>(null);
  const [failure, setFailure] = useState<RelaunchFailure | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onRelaunchRequired(next => setTarget(next));

    return () => {
      unsubscribe();
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const restart = useCallback(() => {
    // Starts on the press, not on mount: nothing to time until the user actually asks for a restart.
    timer.current = setTimeout(() => {
      // Nothing observable distinguishes a restart in flight from one that silently did nothing.
      if (__DEV__) {
        console.log(
          '[relaunch] ineffective: restart() returned and the process is still alive',
        );
      }
      setFailure('ineffective');
    }, RESTART_TIMEOUT_MS);

    try {
      relaunchApp();
    } catch (error) {
      // Module not in this build; a teammate who pulled without rebuilding lands here.
      if (timer.current) {
        clearTimeout(timer.current);
      }
      if (__DEV__) {
        console.log('[relaunch] absent: ' + String(error));
      }
      setFailure('absent');
    }
  }, []);

  return { target, failure, restart };
}
