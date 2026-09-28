import { useCallback, useEffect, useRef, useState } from 'react';
import Sound from 'react-native-nitro-sound';

/**
 * Playback for a remote recording. Below features/ with useImagePicker and useCurrentLocation
 * because it wraps a device capability, not a feature: F-04 plays an issue's recording and
 * CommentResponseDto already carries a voiceUrl for a thread to play next.
 */
// Sound is a module-scope singleton in the library, so two of these fighting over it would
// cut each other off. One player per screen is the contract.
const PROGRESS_INTERVAL_SECONDS = 0.25;

export type AudioPlayerState = {
  isPlaying: boolean;
  /** 0 to 1. Stays 0 until the first playback callback reports a duration. */
  progress: number;
  /** Milliseconds, straight off the player. */
  positionMs: number;
  durationMs: number;
  hasFailed: boolean;
};

const IDLE: AudioPlayerState = {
  isPlaying: false,
  progress: 0,
  positionMs: 0,
  durationMs: 0,
  hasFailed: false,
};

export function useAudioPlayer(url?: string) {
  const [state, setState] = useState<AudioPlayerState>(IDLE);
  const isMounted = useRef(true);
  /** Distinguishes "never started" from "paused mid-way", which resume needs. */
  const hasStarted = useRef(false);

  const detach = useCallback(() => {
    Sound.removePlayBackListener();
    Sound.removePlaybackEndListener();
  }, []);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      detach();
      // Fire and forget: the screen is already gone, and a rejected stop has nowhere to go.
      Sound.stopPlayer().catch(() => {});
    };
  }, [detach]);

  // A new url is a different recording, so whatever is playing has to stop first.
  useEffect(() => {
    hasStarted.current = false;
    setState(IDLE);
  }, [url]);

  const stop = useCallback(async (): Promise<void> => {
    detach();
    hasStarted.current = false;

    try {
      await Sound.stopPlayer();
    } catch {
      // Already stopped. Nothing to report: the state below is what the UI reads.
    }

    if (isMounted.current) {
      setState(IDLE);
    }
  }, [detach]);

  const play = useCallback(async (): Promise<void> => {
    if (!url) {
      return;
    }

    if (hasStarted.current) {
      try {
        await Sound.resumePlayer();
        if (isMounted.current) {
          setState(current => ({ ...current, isPlaying: true }));
        }
      } catch {
        if (isMounted.current) {
          setState(current => ({ ...current, isPlaying: false, hasFailed: true }));
        }
      }
      return;
    }

    try {
      Sound.setSubscriptionDuration(PROGRESS_INTERVAL_SECONDS);

      Sound.addPlayBackListener(({ currentPosition, duration }) => {
        if (!isMounted.current) {
          return;
        }
        setState(current => ({
          ...current,
          isPlaying: true,
          hasFailed: false,
          positionMs: currentPosition,
          durationMs: duration,
          // Guarded: duration is 0 on the first callback, and 0/0 renders a NaN-width bar.
          progress: duration > 0 ? Math.min(currentPosition / duration, 1) : 0,
        }));
      });

      Sound.addPlaybackEndListener(() => {
        if (isMounted.current) {
          // Back to the start rather than held at the end, so the button reads "play" again.
          setState({ ...IDLE });
        }
        hasStarted.current = false;
        detach();
      });

      await Sound.startPlayer(url);
      hasStarted.current = true;
    } catch {
      detach();
      hasStarted.current = false;
      if (isMounted.current) {
        setState({ ...IDLE, hasFailed: true });
      }
    }
  }, [url, detach]);

  const pause = useCallback(async (): Promise<void> => {
    try {
      await Sound.pausePlayer();
    } catch {
      // Nothing was playing. The state below is still the truth the UI renders.
    }

    if (isMounted.current) {
      setState(current => ({ ...current, isPlaying: false }));
    }
  }, []);

  const toggle = useCallback(
    () => (state.isPlaying ? pause() : play()),
    [state.isPlaying, pause, play],
  );

  return { ...state, canPlay: Boolean(url), play, pause, stop, toggle };
}
