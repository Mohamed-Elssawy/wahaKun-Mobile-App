import { HttpError } from '@microsoft/signalr';

import { ApiError } from '../errors';
import { createHubClient } from '../hubClient';

type Handler = (...args: unknown[]) => void;

/** Outcomes for the next start() calls across connections, in order; empty means succeed. */
const mockStartPlan: Array<Error | null> = [];

class MockConnection {
  state = 'Disconnected';
  handlers = new Map<string, Handler[]>();
  reconnected: (() => void) | null = null;
  closed: (() => void) | null = null;
  start = jest.fn(async () => {
    const outcome = mockStartPlan.shift();
    if (outcome) {
      throw outcome;
    }
    this.state = 'Connected';
  });
  stop = jest.fn(async () => {
    this.state = 'Disconnected';
  });
  invoke = jest.fn(async (..._args: unknown[]): Promise<unknown> => undefined);
  on(event: string, handler: Handler) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
  }
  onreconnected(cb: () => void) {
    this.reconnected = cb;
  }
  onclose(cb: () => void) {
    this.closed = cb;
  }
  emit(event: string, ...args: unknown[]) {
    (this.handlers.get(event) ?? []).forEach(handler => handler(...args));
  }
}

const mockConnections: MockConnection[] = [];
const mockUrlOptions: Array<{ accessTokenFactory: () => Promise<string> }> = [];

jest.mock('@microsoft/signalr', () => {
  const actual = jest.requireActual('@microsoft/signalr');
  class Builder {
    withUrl(_url: string, options: { accessTokenFactory: () => Promise<string> }) {
      mockUrlOptions.push(options);
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      const connection = new MockConnection();
      mockConnections.push(connection);
      return connection;
    }
  }
  return { ...actual, HubConnectionBuilder: Builder };
});

const mockRefresh = jest.fn();
const mockExpire = jest.fn();
jest.mock('../session', () => ({
  getValidAccessToken: () => Promise.resolve('token-1'),
  refreshSessionOutcome: () => mockRefresh(),
  expireSession: () => mockExpire(),
}));

const ERRORS = {
  comment_blocked: { status: 422, code: 'COMMENT_REJECTED' },
  issue_not_found: { status: 404, code: 'ISSUE_NOT_FOUND' },
};

/** What @microsoft/signalr rejects invoke with when the hub throws HubException(code). */
const hubException = (code: string) =>
  new Error(`An unexpected error occurred invoking 'SendComment' on the server. HubException: ${code}`);

const flush = () => new Promise<void>(resolve => setImmediate(() => resolve()));

/** The ApiError a call rejected with; resolving instead fails the test. */
const rejection = (promise: Promise<unknown>): Promise<ApiError> =>
  promise.then(
    () => {
      throw new Error('expected the call to reject');
    },
    (error: ApiError) => error,
  );

beforeEach(() => {
  mockConnections.length = 0;
  mockUrlOptions.length = 0;
  mockStartPlan.length = 0;
  mockRefresh.mockReset();
  mockExpire.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('createHubClient', () => {
  it('opens one connection however many holders retain it', async () => {
    const hub = createHubClient('http://host/hubs/community');

    hub.retain();
    hub.retain();
    await flush();

    expect(mockConnections).toHaveLength(1);
    expect(mockConnections[0].start).toHaveBeenCalledTimes(1);
    expect(hub.isConnected()).toBe(true);
  });

  it('signs the connection with the session token', async () => {
    createHubClient('http://host/hubs/community').retain();
    await flush();

    await expect(mockUrlOptions[0].accessTokenFactory()).resolves.toBe('token-1');
  });

  it('starts on demand for an invoke and returns the hub method result', async () => {
    const hub = createHubClient('http://host/hubs/community');
    hub.on('Anything', jest.fn());
    // on() alone builds nothing; the invoke has to.
    expect(mockConnections).toHaveLength(0);

    const pending = hub.invoke('VoteIssue', { issueId: 'i1' });
    mockConnections[0].invoke.mockResolvedValueOnce({ issueId: 'i1', hasVoted: true, count: 3 });

    await expect(pending).resolves.toEqual({ issueId: 'i1', hasVoted: true, count: 3 });
    expect(mockConnections[0].start).toHaveBeenCalledTimes(1);
    expect(mockConnections[0].invoke).toHaveBeenCalledWith('VoteIssue', { issueId: 'i1' });
  });

  it('turns a HubException code into an ApiError the error taxonomy already reads', async () => {
    const hub = createHubClient('http://host/hubs/community', { errors: ERRORS });
    hub.retain();
    await flush();
    mockConnections[0].invoke.mockRejectedValueOnce(hubException('comment_blocked'));

    const error = await rejection(hub.invoke('SendComment', {}));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.code).toBe('COMMENT_REJECTED');
  });

  it('reads an unlisted hub code as a server error, not a network one', async () => {
    const hub = createHubClient('http://host/hubs/community', { errors: ERRORS });
    hub.retain();
    await flush();
    mockConnections[0].invoke.mockRejectedValueOnce(hubException('something_new'));

    const error = await rejection(hub.invoke('SendComment', {}));

    expect(error.status).toBe(500);
    expect(error.isNetworkError).toBe(false);
  });

  it('reads a call that never reached the hub as offline', async () => {
    const hub = createHubClient('http://host/hubs/community');
    hub.retain();
    await flush();
    mockConnections[0].invoke.mockRejectedValueOnce(
      new Error("Cannot send data if the connection is not in the 'Connected' State."),
    );

    const error = await rejection(hub.invoke('ShareIssue', {}));

    expect(error.isNetworkError).toBe(true);
  });

  it('refreshes once and retries when negotiate refuses the token', async () => {
    mockStartPlan.push(new HttpError('Unauthorized', 401));
    mockRefresh.mockResolvedValue('refreshed');
    const hub = createHubClient('http://host/hubs/community');

    const pending = hub.invoke<number>('ShareIssue', {});
    mockConnections[0].invoke.mockResolvedValueOnce(5);

    await expect(pending).resolves.toBe(5);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockConnections[0].start).toHaveBeenCalledTimes(2);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it('ends the session when the refresh is refused, and reports 401', async () => {
    mockStartPlan.push(new HttpError('Unauthorized', 401));
    mockRefresh.mockResolvedValue('refused');
    const hub = createHubClient('http://host/hubs/community');

    const error = await rejection(hub.invoke('ShareIssue', {}));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.isUnauthorized).toBe(true);
    expect(mockExpire).toHaveBeenCalledTimes(1);
    expect(mockConnections[0].invoke).not.toHaveBeenCalled();
  });

  it('keeps the session when the refresh could not reach the server', async () => {
    mockStartPlan.push(new HttpError('Unauthorized', 401));
    mockRefresh.mockResolvedValue('network');
    const hub = createHubClient('http://host/hubs/community');

    await hub.invoke('ShareIssue', {}).catch(() => undefined);

    expect(mockExpire).not.toHaveBeenCalled();
  });

  it('reads an unreachable negotiate as offline', async () => {
    mockStartPlan.push(new TypeError('Network request failed'));
    const hub = createHubClient('http://host/hubs/community');

    const error = await rejection(hub.invoke('ShareIssue', {}));

    expect(error.isNetworkError).toBe(true);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('attaches one server handler per event and fans out to every listener', async () => {
    const hub = createHubClient('http://host/hubs/community');
    const first = jest.fn();
    const second = jest.fn();

    const stopFirst = hub.on('MakeVote', first);
    hub.on('MakeVote', second);
    hub.retain();
    await flush();

    expect(mockConnections[0].handlers.get('MakeVote')).toHaveLength(1);
    mockConnections[0].emit('MakeVote', { newCount: 2 });
    stopFirst();
    mockConnections[0].emit('MakeVote', { newCount: 3 });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('keeps delivering to other listeners when one throws', async () => {
    const hub = createHubClient('http://host/hubs/community');
    const healthy = jest.fn();
    hub.on('MakeShare', () => {
      throw new Error('screen bug');
    });
    hub.on('MakeShare', healthy);
    hub.retain();
    await flush();

    mockConnections[0].emit('MakeShare', {});

    expect(healthy).toHaveBeenCalledTimes(1);
  });

  it('runs onConnected after the first start and after every reconnect, with the raw invoke', async () => {
    const onConnected = jest.fn(async (invoke: (m: string, ...a: unknown[]) => Promise<unknown>) => {
      await invoke('JoinIssue', 'i1');
    });
    const hub = createHubClient('http://host/hubs/community', { onConnected });

    hub.retain();
    await flush();
    mockConnections[0].reconnected?.();
    await flush();

    expect(onConnected).toHaveBeenCalledTimes(2);
    expect(mockConnections[0].invoke).toHaveBeenCalledWith('JoinIssue', 'i1');
  });

  it('does not fail the start when a rejoin fails', async () => {
    const hub = createHubClient('http://host/hubs/community', {
      onConnected: () => Promise.reject(new Error('issue gone')),
    });

    await expect(hub.invoke('ShareIssue', {})).resolves.toBeUndefined();
  });

  it('stops only after the last holder has been gone for the idle window', async () => {
    jest.useFakeTimers();
    const hub = createHubClient('http://host/hubs/community');
    const releaseA = hub.retain();
    await Promise.resolve();
    await Promise.resolve();

    releaseA();
    jest.advanceTimersByTime(5000);
    const releaseB = hub.retain();
    jest.advanceTimersByTime(10000);
    expect(mockConnections[0].stop).not.toHaveBeenCalled();

    releaseB();
    releaseB();
    jest.advanceTimersByTime(10000);
    expect(mockConnections[0].stop).toHaveBeenCalledTimes(1);
  });

  it('after reset, a holder from before cannot release one from after', async () => {
    jest.useFakeTimers();
    const hub = createHubClient('http://host/hubs/community');
    const stale = hub.retain();
    await hub.reset();

    hub.retain();
    stale();
    jest.advanceTimersByTime(20000);

    const current = mockConnections[mockConnections.length - 1];
    expect(mockConnections).toHaveLength(2);
    expect(current.stop).not.toHaveBeenCalled();
  });
});
