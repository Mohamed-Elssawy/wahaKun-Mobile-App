import { Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { CaptureHeader } from '../components/CaptureHeader';
import { QueuedConfirmationSheet } from '../components/QueuedConfirmationSheet';
import ReportAnalyzingScreen from '../screens/ReportAnalyzingScreen';

import type { SubmissionState } from '../hooks/useReportSubmission';
import type { ComponentProps } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';

let mockState: SubmissionState;
let mockPhotoUri: string | null;

jest.mock('../hooks/useReportSubmission', () => ({
  useReportSubmission: () => ({ state: mockState, retry: jest.fn(), discard: jest.fn() }),
}));
jest.mock('../hooks/useQueuedPhoto', () => ({ useQueuedPhoto: () => mockPhotoUri }));

const popTo = jest.fn();
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 24, left: 0, right: 0, bottom: 0 },
};

function render(state: SubmissionState, photoUri: string | null): ReactTestRenderer {
  mockState = state;
  mockPhotoUri = photoUri;
  const props = {
    route: { params: { localId: 'local-1', mode: 'photo' } },
    navigation: { popTo, goBack: jest.fn(), reset: jest.fn(), replace: jest.fn() },
  } as unknown as ComponentProps<typeof ReportAnalyzingScreen>;
  let tree: ReactTestRenderer | undefined;

  act(() => {
    tree = create(
      <SafeAreaProvider initialMetrics={metrics}>
        <ReportAnalyzingScreen {...props} />
      </SafeAreaProvider>,
    );
  });

  return tree!;
}

// E10 / C36: X-02a now redraws F-02's header and photo behind the scrim instead of an empty body.
describe('X-02a, saved offline', () => {
  it('draws the capture surface behind the sheet, out of reach of touch and screen reader', () => {
    const tree = render({ kind: 'saved' }, 'data:image/jpeg;base64,AAAA');
    const header = tree.root.findByType(CaptureHeader);
    const surface = tree.root.findAll(
      node => typeof node.type === 'string' && node.props.pointerEvents === 'none',
    )[0];

    expect(header.props.mode).toBe('photo');
    expect(tree.root.findByType(Image).props.source).toEqual({
      uri: 'data:image/jpeg;base64,AAAA',
    });
    expect(surface.props.importantForAccessibility).toBe('no-hide-descendants');
    // The header is inside the inert surface; the sheet is not.
    expect(surface.findAllByType(CaptureHeader)).toHaveLength(1);
    expect(surface.findAllByType(QueuedConfirmationSheet)).toHaveLength(0);
  });

  it('still shows the sheet, and its way on, when the photo cannot be restored', () => {
    const tree = render({ kind: 'saved' }, null);

    expect(tree.root.findAllByType(Image)).toHaveLength(0);
    act(() => tree.root.findByType(QueuedConfirmationSheet).props.onViewReports());
    expect(popTo).toHaveBeenCalledWith('Home', { screen: 'MyReports' });
  });

  it('leaves the analysing state as it was: its own header, no capture surface', () => {
    const tree = render({ kind: 'working' }, 'data:image/jpeg;base64,AAAA');

    expect(tree.root.findAllByType(CaptureHeader)).toHaveLength(0);
    expect(tree.root.findAllByType(QueuedConfirmationSheet)).toHaveLength(0);
  });
});
