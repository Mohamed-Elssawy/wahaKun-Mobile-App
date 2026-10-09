/** SignalR transport. In api/ for the same reason client.ts is: it signs with the session's token. */
// Features bind method and event names on top (features/community/services/communityHub.ts);
// this file knows nothing about any one hub.

import {
  HttpError,
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  TimeoutError,
} from '@microsoft/signalr';
import { addEventListener as onConnectivityChange } from '@react-native-community/netinfo';
import { AppState } from 'react-native';

import { API_TIMEOUT_MS } from '@/config/env';

import { ApiError } from './errors';
import { expireSession, getValidAccessToken, refreshSessionOutcome } from './session';

import type { HubConnection } from '@microsoft/signalr';

/** What a HubException's message (a stable code, never prose) becomes on this side. */
export type HubErrorMapping = { status: number; code?: string };

export type HubClientOptions = {
  /** The hub's own error codes, e.g. CommunityHubErrors on the server. Unlisted codes are a 500. */
  errors?: Record<string, HubErrorMapping>;
  /**
   * Runs after every successful start and reconnect: group membership does not survive either.
   * Gets the raw connection's invoke, not HubClient.invoke, which would wait on this very start.
   */
  onConnected?: (invoke: (method: string, ...args: unknown[]) => Promise<unknown>) => Promise<void>;
};

export type HubClient = {
  /** Keeps the connection up while held. The returned release is idempotent. */
  retain: () => () => void;
  /** Starts the connection if it has to, then calls the hub method. Rejects with an ApiError. */
  invoke: <T>(method: string, ...args: unknown[]) => Promise<T>;
  /** One server-side handler per event name however many listeners subscribe, so nothing doubles. */
  on: (event: string, listener: (...args: unknown[]) => void) => () => void;
  isConnected: () => boolean;
  /** Tears the connection down regardless of holders. On logout: it was signed as that user. */
  reset: () => Promise<void>;
};

/** After the reconnect schedule gives up, how long to wait before starting over. */
const RESTART_DELAY_MS = 15000;
/** A screen change releases one holder and retains the next; don't drop the socket in between. */
const IDLE_STOP_MS = 10000;
const RECONNECT_DELAYS_MS = [0, 2000, 5000, 10000, 30000];

const HUB_EXCEPTION = /HubException: (\S+)/;

function toApiError(error: unknown, url: string, method: string, options: HubClientOptions): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof HttpError) {
    return ApiError.fromResponse(error.statusCode, { method, url, cause: error });
  }
  if (error instanceof TimeoutError) {
    return ApiError.timeout({ method, url, cause: error });
  }

  const message = error instanceof Error ? error.message : String(error);
  const hubCode = HUB_EXCEPTION.exec(message)?.[1];
  if (hubCode) {
    const mapped = options.errors?.[hubCode] ?? { status: 500 };
    return ApiError.fromResponse(mapped.status, {
      method,
      url,
      code: mapped.code,
      serverMessage: hubCode,
      cause: error,
    });
  }

  // Not connected, connection dropped mid-call, negotiate unreachable: the server never answered.
  return ApiError.network({ method, url, cause: error });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      reason => {
        clearTimeout(timer);
        reject(reason);
      },
    );
  });
}

export function createHubClient(url: string, options: HubClientOptions = {}): HubClient {
  let connection: HubConnection | null = null;
  let starting: Promise<void> | null = null;
  let holders = 0;
  // Bumped by reset(), so a holder from before a logout cannot release a holder after it.
  let generation = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;
  let unwatch: (() => void) | null = null;
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  function attachHandler(conn: HubConnection, event: string): void {
    conn.on(event, (...args: unknown[]) => {
      // A copy: a listener that unsubscribes while being called must not skip its neighbour.
      [...(listeners.get(event) ?? [])].forEach(listener => {
        try {
          listener(...args);
        } catch {
          // One broken screen must not stop the others hearing the event.
        }
      });
    });
  }

  function build(): HubConnection {
    const conn = new HubConnectionBuilder()
      .withUrl(url, {
        // Called on every start and reconnect, so a refreshed token is picked up without rebuilding.
        accessTokenFactory: async () => (await getValidAccessToken()) ?? '',
        // React Native has WebSocket and fetch but no EventSource, so SSE is never offered.
        // eslint-disable-next-line no-bitwise -- HttpTransportType is a flags enum.
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        headers: { 'ngrok-skip-browser-warning': 'true' },
      })
      .withAutomaticReconnect(RECONNECT_DELAYS_MS)
      .configureLogging(__DEV__ ? LogLevel.Warning : LogLevel.None)
      .build();

    listeners.forEach((_, event) => attachHandler(conn, event));

    conn.onreconnected(() => {
      runOnConnected(conn);
    });
    conn.onclose(() => {
      // The reconnect schedule ran out, or the server closed us. Try again later if still wanted.
      scheduleRestart();
    });
    return conn;
  }

  async function startOnce(conn: HubConnection): Promise<void> {
    try {
      await withTimeout(conn.start(), API_TIMEOUT_MS);
    } catch (error) {
      if (!(error instanceof HttpError) || error.statusCode !== 401) {
        throw error;
      }
      // Negotiate refused the token. Same rule as client.ts: one refresh, then the session ends.
      const outcome = await refreshSessionOutcome();
      if (outcome === 'refused') {
        await expireSession();
        throw error;
      }
      if (outcome === 'network') {
        throw error;
      }
      await withTimeout(conn.start(), API_TIMEOUT_MS);
    }
  }

  /** Never rejects: a group that failed to rejoin must not turn a live connection into an error. */
  async function runOnConnected(conn: HubConnection): Promise<void> {
    await options
      .onConnected?.((method, ...args) => conn.invoke(method, ...args))
      .catch(() => undefined);
  }

  function ensureStarted(): Promise<void> {
    if (!connection) {
      connection = build();
    }
    const conn = connection;
    if (conn.state === HubConnectionState.Connected) {
      return Promise.resolve();
    }
    if (starting) {
      return starting;
    }
    if (conn.state !== HubConnectionState.Disconnected) {
      // Reconnecting: the library owns this attempt and onreconnected rejoins the groups.
      return Promise.reject(new Error('Hub is reconnecting'));
    }

    starting = startOnce(conn)
      .then(() => runOnConnected(conn))
      .finally(() => {
        starting = null;
      });
    return starting;
  }

  function scheduleRestart(): void {
    if (holders === 0 || restartTimer) {
      return;
    }
    restartTimer = setTimeout(() => {
      restartTimer = null;
      tryStart();
    }, RESTART_DELAY_MS);
  }

  function tryStart(): void {
    if (holders === 0) {
      return;
    }
    ensureStarted().catch(() => scheduleRestart());
  }

  function watchConnectivity(): void {
    if (unwatch) {
      return;
    }
    const stopNetInfo = onConnectivityChange(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        tryStart();
      }
    });
    // NetInfo misses a phone foregrounded after its radio came back, as reportQueue found.
    const appState = AppState.addEventListener('change', status => {
      if (status === 'active') {
        tryStart();
      }
    });
    unwatch = () => {
      stopNetInfo();
      appState.remove();
    };
  }

  async function stop(): Promise<void> {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
    unwatch?.();
    unwatch = null;
    const conn = connection;
    if (conn && conn.state !== HubConnectionState.Disconnected) {
      await conn.stop().catch(() => undefined);
    }
  }

  function retain(): () => void {
    holders += 1;
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    watchConnectivity();
    tryStart();

    let released = false;
    const heldIn = generation;
    return () => {
      if (released || heldIn !== generation) {
        return;
      }
      released = true;
      holders -= 1;
      if (holders === 0) {
        idleTimer = setTimeout(() => {
          idleTimer = null;
          if (holders === 0) {
            stop();
          }
        }, IDLE_STOP_MS);
      }
    };
  }

  async function invoke<T>(method: string, ...args: unknown[]): Promise<T> {
    // A one-off call from a screen that never retained still needs the socket for its duration.
    const release = retain();
    try {
      await ensureStarted();
      return await (connection as HubConnection).invoke<T>(method, ...args);
    } catch (error) {
      throw toApiError(error, url, method, options);
    } finally {
      release();
    }
  }

  function on(event: string, listener: (...args: unknown[]) => void): () => void {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
      if (connection) {
        attachHandler(connection, event);
      }
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
    };
  }

  function isConnected(): boolean {
    return connection?.state === HubConnectionState.Connected;
  }

  async function reset(): Promise<void> {
    generation += 1;
    holders = 0;
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    await stop();
    connection = null;
  }

  return { retain, invoke, on, isConnected, reset };
}
