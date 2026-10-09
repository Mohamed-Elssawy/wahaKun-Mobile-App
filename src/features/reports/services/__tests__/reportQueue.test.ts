// Retry policy, persistence and ordering all typecheck whatever they actually do.

import { ApiError } from '@/api';
import type { PickedImage } from '@/types/image';

import {
  discardQueuedReport,
  drainQueue,
  enqueueReport,
  getQueueSnapshot,
  QueueFullError,
  resetReportQueue,
  resumeReportQueue,
  retryQueuedReport,
} from '../reportQueue';

// The shared mock returns null for everything, which cannot model a restart.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve([...store.keys()])),
      removeMany: jest.fn((keys: string[]) => {
        keys.forEach(key => store.delete(key));
        return Promise.resolve();
      }),
      getMany: jest.fn(() => Promise.resolve({})),
      setMany: jest.fn(() => Promise.resolve()),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      __store: store,
    },
  };
});

jest.mock('@/api', () => {
  const actual = jest.requireActual('@/api');
  return { ...actual, getAccessToken: jest.fn(() => Promise.resolve('test-token')) };
});

// `mock` prefix required: jest hoists the factory above these declarations.
const mockAnalyzeIssue = jest.fn();
const mockCreateIssue = jest.fn();

jest.mock('../index', () => ({
  reportApi: {
    analyzeIssue: (...args: unknown[]) => mockAnalyzeIssue(...args),
    createIssue: (...args: unknown[]) => mockCreateIssue(...args),
  },
}));

const analyzeIssue = mockAnalyzeIssue;
const createIssue = mockCreateIssue;

const PHOTO: PickedImage = {
  uri: 'file:///mock/photo.jpg',
  type: 'image/jpeg',
  fileName: 'photo.jpg',
};

const offlineError = () => ApiError.network({});
const rejectedError = () => ApiError.fromResponse(400, { code: 'VALIDATION_FAILED' });
const unauthorizedError = () => ApiError.fromResponse(401, { code: 'TOKEN_EXPIRED' });

/** How ReportService refuses a below-Medium problem: 422 ISSUE_PRIORITY_TOO_LOW. */
const tooMinorError = () =>
  ApiError.fromResponse(422, { code: 'ISSUE_PRIORITY_TOO_LOW' });

const ANALYSIS = {
  filePath: 'reportimage/analysed.jpg',
  problemName: 'Pipe_Damage',
  problemArabic: 'تسريب',
  confidence: 0.91,
  severity: 'حرجة' as const,
  recommendation: '',
  repairSteps: [],
};

const asyncStorage = jest.requireMock('@react-native-async-storage/async-storage')
  .default as { __store: Map<string, string> };

beforeEach(async () => {
  await resetReportQueue();
  asyncStorage.__store.clear();
  analyzeIssue.mockReset();
  createIssue.mockReset();
  analyzeIssue.mockResolvedValue(ANALYSIS);
  createIssue.mockResolvedValue({ id: 'r-1', status: 'Diagnosed' });
});

describe('enqueue', () => {
  it('accepts a report and leaves the queue empty once it uploads', async () => {
    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    expect(analyzeIssue).toHaveBeenCalledTimes(1);
    expect(getQueueSnapshot().items).toHaveLength(0);
  });

  // AnalyzeIssueRequest is (Photo, Latitude, Longitude), and the Hangfire job that files the
  // issue takes its GPSLocation from there. A coordinate held back from analyze is lost for good.
  it('hands the coordinate to analyze, which is the only call the server reads it from', async () => {
    await enqueueReport({ photo: PHOTO, latitude: 25.4378, longitude: 30.5531 });
    await drainQueue();

    expect(analyzeIssue).toHaveBeenCalledWith(expect.anything(), {
      latitude: 25.4378,
      longitude: 30.5531,
    });
  });

  it('analyses before it files, and files what the model returned', async () => {
    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    // Order matters: create is what stores the issue, and it needs analyze's filePath.
    expect(analyzeIssue.mock.invocationCallOrder[0]).toBeLessThan(
      createIssue.mock.invocationCallOrder[0],
    );
    expect(createIssue).toHaveBeenCalledWith(
      expect.objectContaining({ analysis: ANALYSIS }),
    );
  });

  it('refuses past the cap instead of dropping the report', async () => {
    analyzeIssue.mockRejectedValue(offlineError());

    for (let i = 0; i < 5; i += 1) {
      await enqueueReport({ photo: PHOTO });
      await drainQueue();
    }

    await expect(enqueueReport({ photo: PHOTO })).rejects.toBeInstanceOf(QueueFullError);
    expect(getQueueSnapshot().items).toHaveLength(5);
  });
});

describe('retry policy', () => {
  it('keeps a network failure queued and backs it off', async () => {
    analyzeIssue.mockRejectedValue(offlineError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    const [item] = getQueueSnapshot().items;
    expect(item.state).toBe('queued');
    expect(item.attempts).toBe(1);
    expect(item.nextAttemptAt).toBeGreaterThan(Date.now());
  });

  it('does not retry a rejection the server will repeat', async () => {
    analyzeIssue.mockRejectedValue(rejectedError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();
    await drainQueue();

    expect(analyzeIssue).toHaveBeenCalledTimes(1);
    expect(getQueueSnapshot().items[0].state).toBe('failed');
  });

  it('pauses the whole queue on an expired session rather than failing the item', async () => {
    analyzeIssue.mockRejectedValue(unauthorizedError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    const [item] = getQueueSnapshot().items;
    // Not 'failed': the report is fine, the session is not.
    expect(item.state).toBe('queued');

    // The same rejected token must not be spent on another attempt.
    await drainQueue();
    expect(analyzeIssue).toHaveBeenCalledTimes(1);
  });

  it('does not busy-loop while paused on an expired session', async () => {
    analyzeIssue.mockRejectedValue(unauthorizedError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();
    expect(getQueueSnapshot().items[0].state).toBe('queued');

    // A paused queue must not re-schedule itself: nothing should poll the token unprompted.
    const { getAccessToken } = jest.requireMock('@/api');
    const callsWhilePaused = getAccessToken.mock.calls.length;
    await new Promise<void>(resolve => setTimeout(resolve, 150));

    expect(getAccessToken.mock.calls.length).toBe(callsWhilePaused);
  });

  it('resumes the paused queue once a new token is issued', async () => {
    analyzeIssue.mockRejectedValueOnce(unauthorizedError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();
    expect(getQueueSnapshot().items[0].state).toBe('queued');

    // A fresh login writes a different token and nudges the queue, which is what un-pauses it.
    const { getAccessToken } = jest.requireMock('@/api');
    getAccessToken.mockResolvedValue('fresh-token');
    analyzeIssue.mockResolvedValue(ANALYSIS);

    resumeReportQueue();
    await drainQueue();

    expect(getQueueSnapshot().items).toHaveLength(0);
  });

  it('backs off further on each successive failure', async () => {
    analyzeIssue.mockRejectedValue(offlineError());

    // A virtual clock, because the real retry schedule starts at five seconds.
    let clock = Date.now();
    const now = jest.spyOn(Date, 'now').mockImplementation(() => clock);

    const waitAfterFailure = async () => {
      await drainQueue();
      const [item] = getQueueSnapshot().items;
      const delay = item.nextAttemptAt - clock;
      clock = item.nextAttemptAt;
      return delay;
    };

    await enqueueReport({ photo: PHOTO });
    const first = await waitAfterFailure();
    const second = await waitAfterFailure();
    const third = await waitAfterFailure();

    expect(second).toBeGreaterThan(first);
    expect(third).toBeGreaterThan(second);

    now.mockRestore();
  });

  it('resets the backoff when the farmer asks to send now', async () => {
    analyzeIssue.mockRejectedValue(offlineError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();
    expect(getQueueSnapshot().items[0].attempts).toBe(1);

    analyzeIssue.mockResolvedValue({ id: 'r-3', status: 'Pending' });
    await retryQueuedReport(getQueueSnapshot().items[0].localId);

    // A manual send ignores the wait it would otherwise be sitting out.
    expect(getQueueSnapshot().items).toHaveLength(0);
  });
});

describe('ordering and concurrency', () => {
  it('uploads oldest first', async () => {
    await enqueueReport({ photo: PHOTO, description: 'first' });
    await enqueueReport({ photo: PHOTO, description: 'second' });
    await drainQueue();

    // analyze only ever gets the photo, so the description rides on create.
    expect(createIssue.mock.calls[0][0].description).toBe('first');
    expect(createIssue.mock.calls[1][0].description).toBe('second');
  });

  it('runs one drain at a time', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    analyzeIssue.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 5);
      });
      inFlight -= 1;
      return ANALYSIS;
    });

    await enqueueReport({ photo: PHOTO });
    await enqueueReport({ photo: PHOTO });
    await Promise.all([drainQueue(), drainQueue(), drainQueue()]);

    expect(maxInFlight).toBe(1);
  });

  it('stops the pass on a network failure but steps over a rejected one', async () => {
    analyzeIssue
      .mockRejectedValueOnce(rejectedError())
      .mockRejectedValueOnce(offlineError());

    await enqueueReport({ photo: PHOTO, description: 'bad' });
    await enqueueReport({ photo: PHOTO, description: 'good' });
    await drainQueue();

    // Both were attempted: the rejection did not end the pass.
    expect(analyzeIssue).toHaveBeenCalledTimes(2);
    const states = getQueueSnapshot().items.map(item => item.state);
    expect(states).toContain('failed');
    expect(states).toContain('queued');
  });
});

describe('delivery', () => {
  it('keeps the report queued when create fails', async () => {
    createIssue.mockRejectedValue(offlineError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    // Nothing exists server-side until create returns, so this is not delivered.
    expect(getQueueSnapshot().items).toHaveLength(1);
  });

  // The whole point of the checkpoint: analyze uploads a photo and runs a model.
  it('does not re-analyse a report create already has an analysis for', async () => {
    createIssue.mockRejectedValueOnce(offlineError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();
    expect(getQueueSnapshot().items[0].analysis).toEqual(ANALYSIS);

    createIssue.mockResolvedValue({ id: 'r-9', status: 'Diagnosed' });
    await retryQueuedReport(getQueueSnapshot().items[0].localId);

    expect(analyzeIssue).toHaveBeenCalledTimes(1);
    expect(getQueueSnapshot().items).toHaveLength(0);
  });

  // Retrying a below-Medium problem answers the same every time, so it must not loop.
  it('fails a report ReportService refuses as too minor', async () => {
    createIssue.mockRejectedValue(tooMinorError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    const [item] = getQueueSnapshot().items;
    expect(item.state).toBe('failed');
    expect(item.failureKind).toBe('tooMinor');
  });

  // ReportService answers 422 PHOTO_* when the model refuses the photo. F-03c, with its Arabic reason.
  it('tells a refused photo apart from a too-minor problem', async () => {
    analyzeIssue.mockRejectedValue(
      ApiError.fromResponse(422, {
        code: 'PHOTO_NOT_IRRIGATION',
        serverMessage: 'الصورة لا تظهر مشكلة ري واضحة.',
      }),
    );

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    const [item] = getQueueSnapshot().items;
    expect(item.failureKind).toBe('unrecognized');
    expect(item.failureMessage).toBe('الصورة لا تظهر مشكلة ري واضحة');
  });

  // AI or MinIO down is not the farmer's fault: keep the report and retry later.
  it('backs off instead of failing when the AI service is unavailable', async () => {
    analyzeIssue.mockRejectedValue(
      ApiError.fromResponse(503, { code: 'AI_SERVICE_UNAVAILABLE' }),
    );

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    const [item] = getQueueSnapshot().items;
    expect(item.state).toBe('queued');
    expect(item.attempts).toBe(1);
    expect(item.lastError).toBeTruthy();
  });
});

describe('persistence', () => {
  it('survives a restart with the photo intact', async () => {
    analyzeIssue.mockRejectedValue(offlineError());

    await enqueueReport({ photo: PHOTO, description: 'queued overnight' });
    await drainQueue();
    expect(getQueueSnapshot().items).toHaveLength(1);

    // Cold boot: module state is gone, AsyncStorage is not.
    await simulateRestart();

    const [restored] = getQueueSnapshot().items;
    expect(restored.description).toBe('queued overnight');

    // retry, not drain: the restored item is still sitting out the backoff it earned.
    analyzeIssue.mockResolvedValue(ANALYSIS);
    await retryQueuedReport(restored.localId);

    expect(createIssue).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'queued overnight' }),
    );
    expect(getQueueSnapshot().items).toHaveLength(0);
  });

  it('re-queues an item a kill left mid-upload', async () => {
    // Never settles, so the item persists as 'uploading', which is what a kill leaves.
    analyzeIssue.mockImplementation(() => new Promise(() => {}));

    await enqueueReport({ photo: PHOTO });
    drainQueue();
    await waitFor(() => getQueueSnapshot().items[0]?.state === 'uploading');

    analyzeIssue.mockReset();
    analyzeIssue.mockRejectedValue(offlineError());
    await simulateRestart();

    // Only reachable if hydrate put 'uploading' back to due-now.
    expect(analyzeIssue).toHaveBeenCalledTimes(1);
    expect(getQueueSnapshot().items[0].state).toBe('queued');
  });
});

describe('discard', () => {
  it('clears a failed report and its photo', async () => {
    analyzeIssue.mockRejectedValue(rejectedError());

    const queued = await enqueueReport({ photo: PHOTO });
    await drainQueue();
    await discardQueuedReport(queued.localId);

    expect(getQueueSnapshot().items).toHaveLength(0);
    const photoKeys = [...asyncStorage.__store.keys()].filter(key =>
      key.startsWith('wk.queue.photo.'),
    );
    expect(photoKeys).toHaveLength(0);
  });
});

/** Polls rather than guessing at tick counts; queue writes go through AsyncStorage. */
async function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('waitFor timed out');
    }
    await new Promise<void>(resolve => {
      setTimeout(() => resolve(), 5);
    });
  }
}

/** Drops in-memory state but not AsyncStorage, which is what a cold boot does. */
async function simulateRestart(): Promise<void> {
  const index = asyncStorage.__store.get('wk.queue.index');
  const photos = [...asyncStorage.__store.entries()].filter(([key]) =>
    key.startsWith('wk.queue.photo.'),
  );

  await resetReportQueue();

  if (index) {
    asyncStorage.__store.set('wk.queue.index', index);
  }
  photos.forEach(([key, value]) => asyncStorage.__store.set(key, value));

  // Any read re-hydrates from storage.
  await drainQueue();
}
