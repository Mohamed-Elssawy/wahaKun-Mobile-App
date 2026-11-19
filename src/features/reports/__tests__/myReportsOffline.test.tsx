import { SectionList } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { ARABIC_NAME } from '@/__fixtures__/bidi';
import { t, tPlural } from '@/i18n';

import { describeQueueBanner } from '../components/QueueBanner';
import { ReportErrorView } from '../components/ReportErrorView';
import MyReportsScreen from '../screens/MyReportsScreen';

import type { useMyReports } from '../hooks/useMyReports';
import type { QueuedReport } from '../types';

type MyReports = ReturnType<typeof useMyReports>;

let mockMyReports: MyReports;
let mockQueue = { isOnline: false, isSending: false, waitingCount: 0 };

jest.mock('../hooks/useMyReports', () => ({ useMyReports: () => mockMyReports }));
jest.mock('../hooks/useReportQueue', () => ({ useReportQueue: () => mockQueue }));
jest.mock('@/features/user/hooks/useIdentity', () => ({
  useIdentity: () => ({ avatarUrl: null }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const QUEUED: QueuedReport = {
  localId: 'local-1',
  description: ARABIC_NAME,
  state: 'queued',
  attempts: 0,
  nextAttemptAt: 0,
  createdAt: '2026-11-12T09:00:00Z',
};

const OFFLINE_ERROR = {
  kind: 'offline',
  message: 'no connection',
} as unknown as MyReports['error'];

function screenState(overrides: Partial<MyReports>): MyReports {
  return {
    sections: [],
    trackers: {},
    isEmpty: true,
    hasAnyReports: false,
    hasLastUpdate: false,
    counts: { all: 0, active: 0, resolved: 0, critical: 0 },
    filter: 'all',
    setFilter: jest.fn(),
    isLoading: false,
    error: null,
    refresh: jest.fn(),
    retryQueued: jest.fn(),
    discardQueued: jest.fn(),
    unreadReportIds: new Set(),
    markReportSeen: jest.fn(),
    ...overrides,
  } as MyReports;
}

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function render() {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <MyReportsScreen />
      </SafeAreaProvider>,
    );
  });
  return tree;
}

describe('F-07 offline: the list stays when there is one (W8)', () => {
  it('shows the queued report under the banner that counts it, not the error view', () => {
    mockQueue = { isOnline: false, isSending: false, waitingCount: 1 };
    mockMyReports = screenState({
      error: OFFLINE_ERROR,
      hasAnyReports: true,
      isEmpty: false,
      sections: [
        { title: t('f07.savedOnDevice'), data: [{ kind: 'queued', queued: QUEUED }] },
      ],
      counts: { all: 1, active: 1, resolved: 0, critical: 0 },
    });

    const tree = render();

    expect(tree.root.findAllByType(ReportErrorView)).toHaveLength(0);
    expect(tree.root.findByType(SectionList).props.sections[0].data).toHaveLength(1);
  });

  it('still shows the error view when there is nothing on the device to show', () => {
    mockQueue = { isOnline: false, isSending: false, waitingCount: 0 };
    mockMyReports = screenState({ error: OFFLINE_ERROR });

    expect(render().root.findAllByType(ReportErrorView)).toHaveLength(1);
  });
});

describe('the queue banner offline: it claims only what is on screen (W6)', () => {
  const offline = { isOnline: false, isSending: false, showDone: false };

  it('says nothing when nothing ever loaded, because the body already says no connection', () => {
    expect(
      describeQueueBanner({ ...offline, waitingCount: 0, showsLastUpdate: false }),
    ).toBeNull();
  });

  it('says it is showing the last update only when a list did load', () => {
    expect(
      describeQueueBanner({ ...offline, waitingCount: 0, showsLastUpdate: true })?.text,
    ).toBe(t('x01.offlineStale'));
  });

  it('counts a waiting report whether or not a list loaded', () => {
    for (const showsLastUpdate of [false, true]) {
      expect(
        describeQueueBanner({ ...offline, waitingCount: 1, showsLastUpdate })?.text,
      ).toBe(t('x01.offlineQueued', { countLabel: tPlural('reports.queuedCount', 1) }));
    }
  });
});
