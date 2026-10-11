import Geolocation from '@react-native-community/geolocation';
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

describe('useCurrentLocation (issue 6)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getCurrentPosition.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it('grants with the fix when the first read works', async () => {
    getCurrentPosition.mockImplementation(succeed);
    const { result } = renderHook(() => useCurrentLocation());
    await flush();

    expect(result.current.status).toBe('granted');
    expect(result.current.location).toEqual({ latitude: 30.05, longitude: 31.23 });
  });

  it('falls back to a low-accuracy read instead of calling a GPS timeout a denial', async () => {
    getCurrentPosition
      .mockImplementationOnce(fail(3))
      .mockImplementationOnce(succeed);
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
