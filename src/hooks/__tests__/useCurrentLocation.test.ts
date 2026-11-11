import Geolocation from '@react-native-community/geolocation';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { act, create } from 'react-test-renderer';

import { useCurrentLocation } from '../useCurrentLocation';

// React Native's act environment flag, so the async state updates below are not warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const getCurrentPosition = Geolocation.getCurrentPosition as jest.Mock;

const fix = { coords: { latitude: 30.05, longitude: 31.23 }, timestamp: 0 };
const succeed = (onSuccess: (p: unknown) => void) => onSuccess(fix);
const fail = (code: number) => (_ok: unknown, onError: (e: unknown) => void) =>
  onError({ code, message: `code ${code}` });

const flush = () => act(async () => {});

/** The hook's AppState subscription, so a test can fire a foreground the way the OS does. */
let appStateListener: ((state: string) => void) | undefined;

jest.spyOn(AppState, 'addEventListener').mockImplementation(((
  _event: string,
  handler: (state: string) => void,
) => {
  appStateListener = handler;
  return {
    remove: () => {
      appStateListener = undefined;
    },
  };
}) as unknown as typeof AppState.addEventListener);

/** Mirrors the hook's own constants, so a change there shows up here as a failure. */
const RETRY_DELAY = 4000;
const MAX_ATTEMPTS = 4;
const NATIVE_READ_TIMEOUT = 30000;

/** Unmounts every harness, so no hook outlives the test that mounted it. */
function unmountAll() {
  act(() => {
    mounted.splice(0).forEach(root => root.unmount());
  });
}

/** Every harness mounted in a test, so `afterEach` can unmount them. */
const mounted: { unmount: () => void }[] = [];

/** Roots are tracked and unmounted so an old hook's timers cannot drive the next test. */
function renderHook<T>(useHook: () => T) {
  const result = { current: undefined as unknown as T };
  function Harness() {
    result.current = useHook();
    return null;
  }
  let root: { unmount: () => void };
  act(() => {
    root = create(require('react').createElement(Harness));
  });
  mounted.push(root!);
  return { result };
}

describe('useCurrentLocation (issue 6)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getCurrentPosition.mockReset();
  });
  afterEach(() => {
    unmountAll();
    jest.useRealTimers();
  });

  it('grants with the fix when the first read works', async () => {
    getCurrentPosition.mockImplementation(succeed);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(result.current.status).toBe('granted');
    expect(result.current.location).toEqual({ latitude: 30.05, longitude: 31.23 });
  });

  it('falls back to a low-accuracy read instead of calling a GPS timeout a denial', async () => {
    getCurrentPosition.mockImplementationOnce(fail(3)).mockImplementationOnce(succeed);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(getCurrentPosition.mock.calls[0][2].enableHighAccuracy).toBe(true);
    expect(getCurrentPosition.mock.calls[1][2].enableHighAccuracy).toBe(false);
    expect(result.current.status).toBe('granted');
  });

  it('stays pending, then retries, when both reads time out', async () => {
    getCurrentPosition.mockImplementationOnce(fail(3)).mockImplementationOnce(fail(3));
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(result.current.status).toBe('pending');

    getCurrentPosition.mockImplementation(succeed);
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    await flush();

    expect(result.current.status).toBe('granted');
  });

  it('is denied only when the device really refuses', async () => {
    getCurrentPosition.mockImplementation(fail(1));
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(result.current.status).toBe('denied');
  });

  it('keeps granted and the last fix when a later re-check fails', async () => {
    getCurrentPosition.mockImplementation(succeed);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();
    expect(result.current.status).toBe('granted');

    getCurrentPosition.mockImplementation(fail(2));
    act(() => result.current.recheck());
    await flush();

    expect(result.current.status).toBe('granted');
    expect(result.current.location).toEqual({ latitude: 30.05, longitude: 31.23 });
  });
});

// D19: a native read that invokes neither callback never settled, so recheck became a no-op.
describe('a native read that never settles (D19)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getCurrentPosition.mockReset();
  });
  afterEach(() => {
    unmountAll();
    jest.useRealTimers();
  });

  /** Neither callback is ever called, which is exactly the shape of the defect. */
  const neverSettles = () => undefined;

  it('does not wedge in pending for ever', async () => {
    getCurrentPosition.mockImplementation(neverSettles);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(result.current.status).toBe('pending');

    // Both reads abandon: 30s for the high-accuracy attempt, 30s for the low-accuracy one.
    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    await flush();

    // Still pending because it is retrying: a read that never answered is not a refusal.
    expect(result.current.status).toBe('pending');
  });

  /** The clock and the flush have to alternate, since each await resumes in a microtask. */
  const abandonOneRead = async () => {
    await act(async () => {
      jest.advanceTimersByTime(NATIVE_READ_TIMEOUT + RETRY_DELAY);
    });
    await flush();
  };

  /** Invisible from status alone, because pending is also what a retrying hook reports. */
  it('releases the in-flight flag, so the automatic retry really runs', async () => {
    getCurrentPosition.mockImplementation(neverSettles);
    renderHook(() => useCurrentLocation());
    await flush();

    // One read in flight, and nothing to resolve it: this is where the hook used to stop.
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);

    // The high-accuracy read is abandoned, so the low-accuracy fallback is reached.
    await abandonOneRead();
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);

    // That one is abandoned too, which ends the attempt and schedules the retry.
    await abandonOneRead();
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);

    // And the retry fires, which it can only do if the finally released the flag.
    await abandonOneRead();
    expect(getCurrentPosition.mock.calls.length).toBeGreaterThan(2);
  });

  it('reaches denied after the retry budget rather than retrying for ever', async () => {
    getCurrentPosition.mockImplementation(neverSettles);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    // Extra ticks after it gives up are harmless: denied schedules nothing.
    for (let read = 0; read < MAX_ATTEMPTS * 3 + 2; read += 1) {
      await abandonOneRead();
    }

    expect(result.current.status).toBe('denied');
  });

  /** Once it has given up there is no retry pending, so recheck is the only thing in flight. */
  it('leaves recheck working after it has given up', async () => {
    getCurrentPosition.mockImplementation(neverSettles);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    for (let read = 0; read < MAX_ATTEMPTS * 3 + 2; read += 1) {
      await abandonOneRead();
    }
    expect(result.current.status).toBe('denied');

    // Before the fix this was a silent no-op: the flag was still set from the first read.
    getCurrentPosition.mockImplementation(succeed);
    act(() => result.current.recheck());
    await flush();

    expect(result.current.status).toBe('granted');
    expect(result.current.location).toEqual({ latitude: 30.05, longitude: 31.23 });
  });
});

// D20: an Approximate grant leaves FINE denied, which once showed the X-05 block regardless.
describe('an Approximate grant is not a denial (D20)', () => {
  const FINE = 'android.permission.ACCESS_FINE_LOCATION';
  const COARSE = 'android.permission.ACCESS_COARSE_LOCATION';

  // PermissionsAndroid is the real module under the RN preset, so these are spies, not mocks.
  let check: jest.SpyInstance;
  let requestMultiple: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    getCurrentPosition.mockReset();
    Platform.OS = 'android';
    check = jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    requestMultiple = jest.spyOn(PermissionsAndroid, 'requestMultiple');
  });

  afterEach(() => {
    unmountAll();
    jest.useRealTimers();
    Platform.OS = 'ios';
    check.mockRestore();
    requestMultiple.mockRestore();
  });

  it('asks for both permissions, not only the precise one', async () => {
    requestMultiple.mockResolvedValue({
      [FINE]: 'granted',
      [COARSE]: 'granted',
    });
    getCurrentPosition.mockImplementation(succeed);
    renderHook(() => useCurrentLocation());
    await flush();

    expect(requestMultiple).toHaveBeenCalledWith([FINE, COARSE]);
  });

  it('proceeds to a fix when only COARSE was granted', async () => {
    requestMultiple.mockResolvedValue({
      [FINE]: 'denied',
      [COARSE]: 'granted',
    });
    getCurrentPosition.mockImplementation(succeed);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(result.current.status).toBe('granted');
    expect(result.current.location).toEqual({ latitude: 30.05, longitude: 31.23 });
  });

  it('still denies when the farmer refuses both', async () => {
    requestMultiple.mockResolvedValue({
      [FINE]: 'denied',
      [COARSE]: 'denied',
    });
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(result.current.status).toBe('denied');
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  // requestMultiple opens an activity that backgrounds the app, so a foreground re-check loops.
  it('asks at most once per mount, even when foregrounded repeatedly', async () => {
    requestMultiple.mockResolvedValue({
      [FINE]: 'never_ask_again',
      [COARSE]: 'never_ask_again',
    });
    renderHook(() => useCurrentLocation());
    await flush();

    expect(requestMultiple).toHaveBeenCalledTimes(1);

    // Three returns from the permission activity, exactly as the loop produced them.
    for (let foreground = 0; foreground < 3; foreground += 1) {
      await act(async () => {
        appStateListener?.('active');
      });
      await flush();
    }

    // Before the fix this was 4 and climbing, and the app never left its splash screen.
    expect(requestMultiple).toHaveBeenCalledTimes(1);
  });

  // The X-05 "open settings" flow must keep working: re-checking on foreground is the point.
  it('still sees a permission granted in Settings on the next foreground', async () => {
    requestMultiple.mockResolvedValue({
      [FINE]: 'never_ask_again',
      [COARSE]: 'never_ask_again',
    });
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(result.current.status).toBe('denied');

    // The farmer grants COARSE in Settings and comes back.
    check.mockImplementation((permission: string) =>
      Promise.resolve(permission === COARSE),
    );
    getCurrentPosition.mockImplementation(succeed);
    await act(async () => {
      appStateListener?.('active');
    });
    await flush();

    expect(result.current.status).toBe('granted');
    expect(requestMultiple).toHaveBeenCalledTimes(1);
  });

  it('skips the request when COARSE is already held', async () => {
    check.mockImplementation((permission: string) =>
      Promise.resolve(permission === COARSE),
    );
    getCurrentPosition.mockImplementation(succeed);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(requestMultiple).not.toHaveBeenCalled();
    expect(result.current.status).toBe('granted');
  });
});
