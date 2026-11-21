import { useCallback, useEffect, useRef, useState } from 'react';
import Sound from 'react-native-nitro-sound';

/** Wraps a device capability, not a feature, over the singleton useAudioPlayer also wraps. */
const METERING_FLOOR_DB = -60;

/** dBFS, roughly -60 (near silence) to 0 (clipping), clamped and normalized for the waveform. */
function normalizeLevel(db: number): number {
  return Math.max(0, Math.min(1, (db - METERING_FLOOR_DB) / -METERING_FLOOR_DB));
}

// attached is distinct from idle: a recording is kept, shown compactly, and replayable.
export type RecorderState = 'idle' | 'recording' | 'reviewing' | 'attached';

export type AudioRecorderState = {
  state: RecorderState;
  /** Counts up from 0, no cap. Frozen at its final value once `reviewing` starts. */
  elapsedSeconds: number;
  /** 0 to 1, live input level. 0 outside `recording`. */
  level: number;
  /** Set once `stop()` resolves; cleared by `discard()`. */
  recordedUri: string | null;
  hasFailed: boolean;
};

const IDLE: AudioRecorderState = {
  state: 'idle',
  elapsedSeconds: 0,
  level: 0,
  recordedUri: null,
  hasFailed: false,
};

export function useAudioRecorder() {
  const [recorder, setRecorder] = useState<AudioRecorderState>(IDLE);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      Sound.removeRecordBackListener();
      // Fire and forget: the screen is already gone, and a rejected stop has nowhere to go.
      Sound.stopRecorder().catch(() => {});
    };
  }, []);

  const start = useCallback(async (): Promise<void> => {
    setRecorder({ ...IDLE, state: 'recording' });

    try {
      Sound.addRecordBackListener(meta => {
        if (!isMounted.current) {
          return;
        }
        setRecorder(current =>
          current.state === 'recording'
            ? {
                ...current,
                elapsedSeconds: Math.floor((meta.recordSecs ?? 0) / 1000),
                level: normalizeLevel(meta.currentMetering ?? METERING_FLOOR_DB),
              }
            : current,
        );
      });

      // meteringEnabled: the waveform needs currentMetering on every tick.
      await Sound.startRecorder(undefined, undefined, true);
    } catch {
      Sound.removeRecordBackListener();
      if (isMounted.current) {
        setRecorder({ ...IDLE, hasFailed: true });
      }
    }
  }, []);

  const stop = useCallback(async (): Promise<void> => {
    Sound.removeRecordBackListener();

    try {
      const uri = await Sound.stopRecorder();
      if (isMounted.current) {
        setRecorder(current => ({ ...current, state: 'reviewing', recordedUri: uri }));
      }
    } catch {
      if (isMounted.current) {
        setRecorder({ ...IDLE, hasFailed: true });
      }
    }
  }, []);

  /** From recording: drops whatever was captured, and the screen owns the confirm. */
  const cancel = useCallback(async (): Promise<void> => {
    Sound.removeRecordBackListener();
    try {
      await Sound.stopRecorder();
    } catch {
      // Nothing was recording. The state below is still the truth the UI renders.
    }
    if (isMounted.current) {
      setRecorder(IDLE);
    }
  }, []);

  /** From `reviewing` or `attached` ("إعادة التسجيل"): back to idle, ready to record again. */
  const discard = useCallback((): void => {
    setRecorder(IDLE);
  }, []);

  /** From `reviewing` ("استخدام هذا التسجيل"): keeps `recordedUri`, drops the review chrome. */
  const confirm = useCallback((): void => {
    setRecorder(current => ({ ...current, state: 'attached' }));
  }, []);

  return { ...recorder, start, stop, cancel, discard, confirm };
}
