import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Counts down from `seconds` to zero, once per second.
 *
 * Holds one interval for the life of the countdown and clears it at zero.
 * Keeping secondsLeft out of the effect's dependencies is what stops the
 * interval being torn down and recreated on every tick.
 */
export function useCountdown(seconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (from: number = seconds) => {
      clear();
      setSecondsLeft(from);

      intervalRef.current = setInterval(() => {
        setSecondsLeft(current => {
          if (current <= 1) {
            clear();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    },
    [clear, seconds],
  );

  useEffect(() => {
    start(seconds);
    return clear;
    // Intentionally runs once — restarts are explicit via start().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { secondsLeft, restart: start, isFinished: secondsLeft <= 0 };
}

/** mm:ss */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}
