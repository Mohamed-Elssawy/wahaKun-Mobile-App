import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { BackHeader } from '@/components/ui';

import { CameraPermissionDenied } from '../components/CameraPermissionDenied';
import { CaptureHeader } from '../components/CaptureHeader';
import { LocationPermissionDenied } from '../components/LocationPermissionDenied';
import { MicrophonePermissionDenied } from '../components/MicrophonePermissionDenied';
import { PhotoReview } from '../components/PhotoReview';
import { VoiceCapture } from '../components/VoiceCapture';
import ReportCaptureScreen from '../screens/ReportCaptureScreen';

import type { useReportCapture } from '../hooks/useReportCapture';
import type { ComponentProps, ComponentType } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';

type Capture = ReturnType<typeof useReportCapture>;

let mockCapture: Capture;

jest.mock('../hooks/useReportCapture', () => ({ useReportCapture: () => mockCapture }));
jest.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({ state: 'idle' }),
}));
// The children are not under test: which of them the screen mounts, and around what, is.
jest.mock('../components/VoiceCapture', () => ({ VoiceCapture: () => null }));
jest.mock('../components/PhotoReview', () => ({ PhotoReview: () => null }));
jest.mock('../components/CameraControlsBar', () => ({ CameraControlsBar: () => null }));

const changeMode = jest.fn();
const goBack = jest.fn();

function capture(overrides: Partial<Capture>): Capture {
  return {
    mode: 'photo',
    changeMode,
    device: { id: 'back' },
    hasPermission: true,
    isPreviewActive: false,
    photo: null,
    submitError: null,
    isLocationDenied: false,
    ...overrides,
  } as unknown as Capture;
}

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 24, left: 0, right: 0, bottom: 0 },
};

function render(state: Partial<Capture>): ReactTestRenderer {
  mockCapture = capture(state);
  const props = {
    route: { params: undefined },
    navigation: { goBack },
  } as unknown as ComponentProps<typeof ReportCaptureScreen>;
  let tree: ReactTestRenderer | undefined;

  act(() => {
    tree = create(
      <SafeAreaProvider initialMetrics={metrics}>
        <ReportCaptureScreen {...props} />
      </SafeAreaProvider>,
    );
  });

  return tree!;
}

const has = (tree: ReactTestRenderer, type: ComponentType<never>) =>
  tree.root.findAllByType(type as ComponentType<unknown>).length > 0;

beforeEach(() => jest.clearAllMocks());

// E10 / C37: the fix was moving X-03/X-04/X-05 off F-02's body onto a plain canvas; these pin that composition.
describe('a permission guard takes the whole capture screen', () => {
  it('X-05: location denied blocks both modes, with a chevron and no F-02 chrome', () => {
    for (const mode of ['photo', 'voice'] as const) {
      const tree = render({ mode, isLocationDenied: true });

      expect(has(tree, LocationPermissionDenied)).toBe(true);
      expect(has(tree, CaptureHeader)).toBe(false);
      expect(has(tree, VoiceCapture)).toBe(false);

      act(() => tree.root.findByType(BackHeader).props.onBack());
    }

    expect(goBack).toHaveBeenCalledTimes(2);
  });

  it('X-03: camera denied in photo mode, and its link is the way to voice', () => {
    const tree = render({ hasPermission: false });

    expect(has(tree, CaptureHeader)).toBe(false);
    act(() => tree.root.findByType(CameraPermissionDenied).props.onUseVoice());

    expect(changeMode).toHaveBeenCalledWith('voice');
  });

  it('X-03 does not fire in voice mode, which needs no camera', () => {
    const tree = render({ mode: 'voice', hasPermission: false });

    expect(has(tree, CameraPermissionDenied)).toBe(false);
    expect(has(tree, CaptureHeader)).toBe(true);
    expect(has(tree, VoiceCapture)).toBe(true);
  });

  it('X-04: answers a refused prompt, and typing instead returns to the voice surface', () => {
    const tree = render({ mode: 'voice' });

    // Not the resting state of the tab: nothing is denied until a recording is asked for.
    expect(has(tree, MicrophonePermissionDenied)).toBe(false);

    act(() => tree.root.findByType(VoiceCapture).props.onMicrophoneDenied());
    expect(has(tree, MicrophonePermissionDenied)).toBe(true);
    expect(has(tree, CaptureHeader)).toBe(false);

    act(() => tree.root.findByType(MicrophonePermissionDenied).props.onUseText());
    expect(has(tree, MicrophonePermissionDenied)).toBe(false);
    expect(has(tree, CaptureHeader)).toBe(true);
    expect(tree.root.findByType(VoiceCapture).props.focusTrigger).toBe(1);
  });

  it('yields to a photo already taken, as it did inside F-02', () => {
    const tree = render({
      hasPermission: false,
      photo: { uri: 'file://p.jpg' } as never,
    });

    expect(has(tree, CameraPermissionDenied)).toBe(false);
    expect(has(tree, PhotoReview)).toBe(true);
    expect(has(tree, CaptureHeader)).toBe(true);
  });

  it('leaves F-02 alone when nothing is denied', () => {
    const tree = render({});

    expect(has(tree, BackHeader)).toBe(false);
    expect(has(tree, CaptureHeader)).toBe(true);
  });
});
