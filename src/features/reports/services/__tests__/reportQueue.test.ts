// Retry policy, persistence and ordering all typecheck whatever they actually do.

import { ApiError, NETWORK_ERROR_STATUS } from '@/api';
import type { PickedImage } from '@/types/image';

import {
  discardQueuedReport,
  drainQueue,
  enqueueReport,
  getQueueSnapshot,
  QueueFullError,
  resetReportQueue,
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
const mockCreateReport = jest.fn();
const mockAnalyzeReport = jest.fn();

jest.mock('../index', () => ({
  reportApi: {
    createReport: (...args: unknown[]) => mockCreateReport(...args),
    analyzeReport: (...args: unknown[]) => mockAnalyzeReport(...args),
  },
}));

const createReport = mockCreateReport;
const analyzeReport = mockAnalyzeReport;

const PHOTO: PickedImage = {
  uri: 'file:///mock/photo.jpg',
  type: 'image/jpeg',
  fileName: 'photo.jpg',
};

const offlineError = () => new ApiError('offline', NETWORK_ERROR_STATUS);
const rejectedError = () => new ApiError('bad photo', 400);
const unauthorizedError = () => new ApiError('expired', 401);

const asyncStorage = jest.requireMock('@react-native-async-storage/async-storage')
  .default as { __store: Map<string, string> };

beforeEach(async () => {
  await resetReportQueue();
  asyncStorage.__store.clear();
  createReport.mockReset();
  analyzeReport.mockReset();
  createReport.mockResolvedValue({ id: 'r-1', status: 'Pending' });
  analyzeReport.mockResolvedValue({ id: 'r-1', status: 'Analyzed' });
});

describe('enqueue', () => {
  it('accepts a report and leaves the queue empty once it uploads', async () => {
    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    expect(createReport).toHaveBeenCalledTimes(1);
    expect(getQueueSnapshot().items).toHaveLength(0);
  });

  it('sends the localId as the idempotency key', async () => {
    const queued = await enqueueReport({ photo: PHOTO });
    await drainQueue();

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: queued.localId }),
    );
  });

  it('refuses past the cap instead of dropping the report', async () => {
    createReport.mockRejectedValue(offlineError());

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
    createReport.mockRejectedValue(offlineError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    const [item] = getQueueSnapshot().items;
    expect(item.state).toBe('queued');
    expect(item.attempts).toBe(1);
    expect(item.nextAttemptAt).toBeGreaterThan(Date.now());
  });

  it('does not retry a rejection the server will repeat', async () => {
    createReport.mockRejectedValue(rejectedError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();
    await drainQueue();

    expect(createReport).toHaveBeenCalledTimes(1);
    expect(getQueueSnapshot().items[0].state).toBe('failed');
  });

  it('pauses the whole queue on an expired session rather than failing the item', async () => {
    createReport.mockRejectedValue(unauthorizedError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    const [item] = getQueueSnapshot().items;
    // Not 'failed': the report is fine, the session is not.
    expect(item.state).toBe('queued');

    // The same rejected token must not be spent on another attempt.
    await drainQueue();
    expect(createReport).toHaveBeenCalledTimes(1);
  });

  it('backs off further on each successive failure', async () => {
    createReport.mockRejectedValue(offlineError());

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
    createReport.mockRejectedValue(offlineError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();
    expect(getQueueSnapshot().items[0].attempts).toBe(1);

    createReport.mockResolvedValue({ id: 'r-3', status: 'Pending' });
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

    expect(createReport.mock.calls[0][0].description).toBe('first');
    expect(createReport.mock.calls[1][0].description).toBe('second');
  });

  it('runs one drain at a time', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    createReport.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 5);
      });
      inFlight -= 1;
      return { id: 'r-1', status: 'Pending' };
    });

    await enqueueReport({ photo: PHOTO });
    await enqueueReport({ photo: PHOTO });
    await Promise.all([drainQueue(), drainQueue(), drainQueue()]);

    expect(maxInFlight).toBe(1);
  });

  it('stops the pass on a network failure but steps over a rejected one', async () => {
    createReport
      .mockRejectedValueOnce(rejectedError())
      .mockRejectedValueOnce(offlineError());

    await enqueueReport({ photo: PHOTO, description: 'bad' });
    await enqueueReport({ photo: PHOTO, description: 'good' });
    await drainQueue();

    // Both were attempted: the rejection did not end the pass.
    expect(createReport).toHaveBeenCalledTimes(2);
    const states = getQueueSnapshot().items.map(item => item.state);
    expect(states).toContain('failed');
    expect(states).toContain('queued');
  });
});

describe('delivery', () => {
  it('leaves the report uploaded when analysis fails', async () => {
    analyzeReport.mockRejectedValue(offlineError());

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    // Analysis is opportunistic; the report already reached the server.
    expect(getQueueSnapshot().items).toHaveLength(0);
  });

  it('does not re-upload a report the server already accepted', async () => {
    analyzeReport.mockRejectedValueOnce(unauthorizedError());
    createReport.mockResolvedValue({ id: 'r-9', status: 'Pending' });

    await enqueueReport({ photo: PHOTO });
    await drainQueue();

    expect(createReport).toHaveBeenCalledTimes(1);
  });
});

describe('persistence', () => {
  it('survives a restart with the photo intact', async () => {
    createReport.mockRejectedValue(offlineError());

    await enqueueReport({ photo: PHOTO, description: 'queued overnight' });
    await drainQueue();
    expect(getQueueSnapshot().items).toHaveLength(1);

    // Cold boot: module state is gone, AsyncStorage is not.
    await simulateRestart();

    const [restored] = getQueueSnapshot().items;
    expect(restored.description).toBe('queued overnight');

    createReport.mockResolvedValue({ id: 'r-2', status: 'Pending' });
    await drainQueue();
    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'queued overnight' }),
    );
  });

  it('re-queues an item a kill left mid-upload', async () => {
    // Never settles, so the item persists as 'uploading', which is what a kill leaves.
    createReport.mockImplementation(() => new Promise(() => {}));

    await enqueueReport({ photo: PHOTO });
    void drainQueue();
    await waitFor(() => getQueueSnapshot().items[0]?.state === 'uploading');

    createReport.mockReset();
    createReport.mockRejectedValue(offlineError());
    await simulateRestart();

    // Only reachable if hydrate put 'uploading' back to due-now.
    expect(createReport).toHaveBeenCalledTimes(1);
    expect(getQueueSnapshot().items[0].state).toBe('queued');
  });
});

describe('discard', () => {
  it('clears a failed report and its photo', async () => {
    createReport.mockRejectedValue(rejectedError());

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
