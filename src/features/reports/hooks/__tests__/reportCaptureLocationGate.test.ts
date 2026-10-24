import { act, create } from 'react-test-renderer';

import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import type { Coordinates, LocationPermissionStatus } from '@/hooks/useCurrentLocation';

import { useReportCapture } from '../useReportCapture';

// React Native's act environment flag, so the async state updates below are not warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockEnqueueReport = jest.fn();

jest.mock('../../services/reportQueue', () => ({
  enqueueReport: (...args: unknown[]) => mockEnqueueReport(...args),
  QueueFullError: class QueueFullError extends Error {},
}));

jest.mock('@/hooks/useCurrentLocation', () => ({
  useCurrentLocation: jest.fn(),
}));

jest.mock('@/hooks/useImagePicker', () => ({
  useImagePicker: () => ({ image: null, error: '', pickFromGallery: jest.fn() }),
}));

jest.mock('react-native-vision-camera', () => ({
  useCameraDevice: () => ({ id: 'back' }),
  useCameraPermission: () => ({ hasPermission: true, requestPermission: jest.fn() }),
  useMicrophonePermission: () => ({ hasPermission: true, requestPermission: jest.fn() }),
  // Returns a bare path, as the real one does; the hook prefixes it with file://.
  usePhotoOutput: () => ({
    capturePhotoToFile: jest.fn().mockResolvedValue({ filePath: '/cache/photo.jpg' }),
  }),
}));

const mockUseCurrentLocation = useCurrentLocation as jest.Mock;

/** What the hook reports while the fix is still being acquired - PENDING, not denied. */
function locationState(
  status: LocationPermissionStatus,
  location: Coordinates | null = null,
) {
  return { location, status, recheck: jest.fn() };
}

const mounted: { unmount: () => void }[] = [];

function renderCapture() {
  const result = { current: undefined as unknown as ReturnType<typeof useReportCapture> };
  function Harness() {
    result.current = useReportCapture('photo');
    return null;
  }
  let root: { unmount: () => void };
  act(() => {
    root = create(require('react').createElement(Harness));
  });
  mounted.push(root!);
  return { result };
}

/** Puts a photo under review, which is the state submit is reachable from. */
async function withPhoto(result: { current: ReturnType<typeof useReportCapture> }) {
  await act(async () => {
    await result.current.capture();
  });
}

beforeEach(() => {
  mockEnqueueReport.mockReset();
  mockEnqueueReport.mockResolvedValue({ localId: 'local-1' });
  mockUseCurrentLocation.mockReset();
});

afterEach(() => {
  act(() => {
    mounted.splice(0).forEach(root => root.unmount());
  });
});

// D7: a PENDING fix is not a DENIED one, so submit was reachable with no coordinate yet.
describe('submit is gated on having a coordinate, not on not being denied (D7)', () => {
  it('still reports isLocationDenied only for an outright refusal', () => {
    mockUseCurrentLocation.mockReturnValue(locationState('pending'));
    const { result } = renderCapture();

    // The X-05 wall stays where it was: a farmer who is merely waiting must not be shown it.
    expect(result.current.isLocationDenied).toBe(false);

    mockUseCurrentLocation.mockReturnValue(locationState('denied'));
    const denied = renderCapture();

    expect(denied.result.current.isLocationDenied).toBe(true);
  });

  it('refuses to enqueue while the fix is still pending', async () => {
    mockUseCurrentLocation.mockReturnValue(locationState('pending'));
    const { result } = renderCapture();
    await withPhoto(result);

    let outcome;
    await act(async () => {
      outcome = await result.current.submit();
    });

    // A photo is in hand, so the only thing refusing is the missing coordinate.
    expect(result.current.photo).not.toBeNull();
    expect(outcome).toEqual({ kind: 'failed' });
    expect(mockEnqueueReport).not.toHaveBeenCalled();
  });

  it('gives the farmer an Arabic reason, so the screen is not a dead end', async () => {
    mockUseCurrentLocation.mockReturnValue(locationState('granted', null));
    const { result } = renderCapture();

    await withPhoto(result);
    await act(async () => {
      await result.current.submit();
    });

    expect(mockEnqueueReport).not.toHaveBeenCalled();
    // X-05's required sub-line, reused verbatim.
    expect(result.current.submitError?.message).toBe(
      'نحتاج موقع المشكلة حتى يصل الخبير إليها — لا يمكن إرسال البلاغ بدونه.',
    );
  });

  it('sends the coordinate once there is one', async () => {
    mockUseCurrentLocation.mockReturnValue(
      locationState('granted', { latitude: 29.2041, longitude: 25.5195 }),
    );
    const { result } = renderCapture();

    await withPhoto(result);
    let outcome;
    await act(async () => {
      outcome = await result.current.submit();
    });

    expect(outcome).toEqual({ kind: 'queued', localId: 'local-1' });
    expect(mockEnqueueReport).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 29.2041, longitude: 25.5195 }),
    );
  });

  // B6. A farmer who grants the permission must not be left staring at a stale refusal.
  it('clears the refusal when the fix arrives', async () => {
    mockUseCurrentLocation.mockReturnValue(locationState('granted', null));
    const { result } = renderCapture();

    await withPhoto(result);
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.submitError).not.toBeNull();

    // The hook re-renders with a fix, exactly as useCurrentLocation does when it resolves one.
    mockUseCurrentLocation.mockReturnValue(
      locationState('granted', { latitude: 29.2, longitude: 25.5 }),
    );
    await act(async () => {
      result.current.setDescription('ماء على السطح');
    });

    expect(result.current.submitError).toBeNull();
  });
});

// W2: isPreviewActive used to ignore isLocationDenied, so a live Camera ran behind the wall.
describe('the live preview never runs behind the X-05 wall (W2)', () => {
  it('stays active while permission is merely pending', () => {
    mockUseCurrentLocation.mockReturnValue(locationState('pending'));
    const { result } = renderCapture();

    expect(result.current.isPreviewActive).toBe(true);
  });

  it('turns off the moment location is denied, with camera/device otherwise ready', () => {
    mockUseCurrentLocation.mockReturnValue(locationState('denied'));
    const { result } = renderCapture();

    expect(result.current.isLocationDenied).toBe(true);
    expect(result.current.isPreviewActive).toBe(false);
  });

  it('comes back once location is granted again, with no second permission request', async () => {
    mockUseCurrentLocation.mockReturnValue(locationState('denied'));
    const { result } = renderCapture();
    expect(result.current.isPreviewActive).toBe(false);

    // The same device the hook re-renders through when a fix arrives, not a remount.
    mockUseCurrentLocation.mockReturnValue(
      locationState('granted', { latitude: 29.2, longitude: 25.5 }),
    );
    await act(async () => {
      result.current.setDescription('رجع المزارع من الإعدادات');
    });

    expect(result.current.isLocationDenied).toBe(false);
    expect(result.current.isPreviewActive).toBe(true);
  });
});
