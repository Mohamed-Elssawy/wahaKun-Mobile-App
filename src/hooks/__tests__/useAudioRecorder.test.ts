import Sound from 'react-native-nitro-sound';
import { act, create } from 'react-test-renderer';

import { useAudioRecorder } from '../useAudioRecorder';

// React Native's act environment flag, so the async state updates below are not warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const startRecorder = Sound.startRecorder as jest.Mock;
const stopRecorder = Sound.stopRecorder as jest.Mock;
const addRecordBackListener = Sound.addRecordBackListener as jest.Mock;

// react-test-renderer has no renderHook; this is the smallest harness that reads the hook live.
function renderHook<T>(useHook: () => T) {
  const result = { current: undefined as unknown as T };
  function Harness() {
    result.current = useHook();
    return null;
  }
  act(() => {
    create(require('react').createElement(Harness));
  });
  return { result };
}

/** Pulls the callback `start()` handed `addRecordBackListener` and fires it once. */
function tick(recordSecsMs: number, currentMetering: number) {
  const onTick = addRecordBackListener.mock.calls.at(-1)?.[0];
  act(() => onTick({ recordSecs: recordSecsMs, currentMetering }));
}

describe('useAudioRecorder', () => {
  beforeEach(() => {
    startRecorder.mockClear();
    stopRecorder.mockClear();
    addRecordBackListener.mockClear();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.state).toBe('idle');
    expect(result.current.recordedUri).toBeNull();
  });

  it('moves to recording and tracks elapsed time and level off native ticks', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe('recording');

    tick(5000, -30);
    // -30dB against a -60dB floor is exactly half the normalized range.
    expect(result.current.elapsedSeconds).toBe(5);
    expect(result.current.level).toBeCloseTo(0.5, 2);
  });

  it('stops into reviewing with the recorded uri, and freezes elapsed time', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      await result.current.start();
    });
    tick(12000, -10);

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.state).toBe('reviewing');
    expect(result.current.recordedUri).toBe('/mock/recording.m4a');
    expect(result.current.elapsedSeconds).toBe(12);

    // A tick after stop must not still be heard: stop() already removed the listener.
    tick(99000, 0);
    expect(result.current.elapsedSeconds).toBe(12);
  });

  it('cancel from recording drops everything back to idle', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      await result.current.start();
    });
    tick(3000, -20);

    await act(async () => {
      await result.current.cancel();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.recordedUri).toBeNull();
  });

  it('discard from reviewing clears the recording; confirm keeps it and moves to attached', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.stop();
    });

    act(() => result.current.confirm());
    expect(result.current.state).toBe('attached');
    expect(result.current.recordedUri).toBe('/mock/recording.m4a');

    act(() => result.current.discard());
    expect(result.current.state).toBe('idle');
    expect(result.current.recordedUri).toBeNull();
  });

  it('passes meteringEnabled so the waveform has real samples to draw', async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      await result.current.start();
    });

    expect(startRecorder).toHaveBeenCalledWith(undefined, undefined, true);
  });
});
