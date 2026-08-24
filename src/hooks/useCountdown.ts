import { useCallback, useEffect, useRef, useState } from 'react';

/** secondsLeft stays out of the deps, or the interval is recreated on every tick. */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; restarts call start()
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
