// Module state, not a hook: the queue outlives every screen and composing never fails.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addEventListener as onConnectivityChange } from '@react-native-community/netinfo';
import { AppState } from 'react-native';

import { getAccessToken } from '@/api';
import { REPORT_QUEUE_MAX } from '@/config/env';

import { describeAnalysisError, describeCreateError } from '../errors';
import { reportApi } from './index';
import {
  persistPhoto,
  pruneOrphanedPhotos,
  removePhoto,
  restorePhoto,
} from './photoStore';

import type { ReportError } from '../errors';
import type { QueuedReport, QueueReportFields } from '../types';

const INDEX_KEY = 'wk.queue.index';

// Capped at the last step, so a queue left open on a dead connection stops burning battery.
const BACKOFF_MS = [5_000, 15_000, 45_000, 120_000, 300_000] as const;

const backoffFor = (attempts: number) =>
  BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length) - 1];

/** Thrown at the cap so the screen can say so rather than silently drop the report. */
export class QueueFullError extends Error {
  constructor() {
    super(`Report queue is full (${REPORT_QUEUE_MAX})`);
    this.name = 'QueueFullError';
  }
}

export type QueueSnapshot = {
  /** Newest first, matching how My Issues lists them. */
  items: readonly QueuedReport[];
  isOnline: boolean;
};

type Listener = (snapshot: QueueSnapshot) => void;

/** One attempt's outcome, which decides whether the drain keeps going. */
type Outcome =
  | 'sent'
  /** Network. Every other item shares that connection, so stop the pass. */
  | 'retry'
  /** This item is bad; others may be fine. Move on. */
  | 'failed'
  /** No usable session. Nothing will succeed until that changes. */
  | 'paused';

let items: QueuedReport[] = [];
let isOnline = true;
let hydrated = false;
let started = false;
let draining: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

// A refresh or fresh login yields a different token, which is what resumes the queue.
let rejectedToken: string | null = null;

// localId -> server id for this session. Read once, then discarded.
const delivered = new Map<string, string>();

const listeners = new Set<Listener>();

function snapshot(): QueueSnapshot {
  return { items, isOnline };
}

function emit(): void {
  const current = snapshot();
  for (const listener of listeners) {
    listener(current);
  }
}

async function persistIndex(): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(items));
}

async function commit(next: QueuedReport[]): Promise<void> {
  items = next;
  await persistIndex();
  emit();
}

const patch = (localId: string, changes: Partial<QueuedReport>) =>
  commit(items.map(item => (item.localId === localId ? { ...item, ...changes } : item)));

async function drop(localId: string): Promise<void> {
  await commit(items.filter(item => item.localId !== localId));
  await removePhoto(localId);
}

async function hydrate(): Promise<void> {
  if (hydrated) {
    return;
  }
  hydrated = true;

  const raw = await AsyncStorage.getItem(INDEX_KEY);
  if (raw) {
    const stored = JSON.parse(raw) as QueuedReport[];
    // Nothing is in flight after a cold boot, so an item left 'uploading' would stick.
    items = stored.map(item =>
      item.state === 'uploading'
        ? { ...item, state: 'queued' as const, nextAttemptAt: 0 }
        : item,
    );
  }

  // A crash between the two writes can leave bytes with no queue entry.
  await pruneOrphanedPhotos(items.map(item => item.localId));
  emit();
}

/** Timers, not polling: nothing wakes a backed-off item on its own. */
function scheduleNextAttempt(): void {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  const due = items
    .filter(item => item.state === 'queued')
    .map(item => item.nextAttemptAt);
  if (due.length === 0) {
    return;
  }

  retryTimer = setTimeout(
    () => {
      retryTimer = null;
      startDrain();
    },
    Math.max(Math.min(...due) - Date.now(), 0),
  );
}

/** Shared tail: whichever of the two calls threw, the item is parked the same way. */
async function handleFailure(item: QueuedReport, error: ReportError): Promise<Outcome> {
  if (error.kind === 'unauthorized') {
    rejectedToken = await getAccessToken();
    await patch(item.localId, { state: 'queued' });
    return 'paused';
  }

  if (error.kind === 'offline') {
    const attempts = item.attempts + 1;
    await patch(item.localId, {
      state: 'queued',
      attempts,
      nextAttemptAt: Date.now() + backoffFor(attempts),
    });
    return 'retry';
  }

  // A refused photo and a too-minor problem answer the same a thousand times. Stop.
  await patch(item.localId, { state: 'failed', failureKind: error.kind });
  return 'failed';
}

async function uploadOne(item: QueuedReport): Promise<Outcome> {
  await patch(item.localId, { state: 'uploading' });

  let { analysis } = item;

  // Only the analyze step needs the bytes; a checkpointed item is past that.
  if (!analysis) {
    const photo = await restorePhoto(item.localId);
    if (!photo) {
      // The bytes are gone and there is no way to get them back, so retrying is a lie.
      await patch(item.localId, { state: 'failed', failureKind: 'unknown' });
      return 'failed';
    }

    try {
      analysis = await reportApi.analyzeIssue(photo);
    } catch (error) {
      return handleFailure(item, describeAnalysisError(error, ''));
    }

    // Checkpointed before create, so a retry re-uploads nothing and re-runs no model.
    await patch(item.localId, { analysis });
  }

  try {
    const report = await reportApi.createIssue({
      analysis,
      description: item.description,
      latitude: item.latitude,
      longitude: item.longitude,
    });

    // Recorded before the drop, so the capture screen can still find where it landed.
    delivered.set(item.localId, report.id);
    await drop(item.localId);
    return 'sent';
  } catch (error) {
    return handleFailure(item, describeCreateError(error, ''));
  }
}

/** True when there is a session worth spending an upload on. */
async function hasUsableSession(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) {
    return false;
  }
  if (token === rejectedToken) {
    return false;
  }
  rejectedToken = null;
  return true;
}

async function runDrain(): Promise<void> {
  await hydrate();

  if (!(await hasUsableSession())) {
    return;
  }

  // Oldest first, so `items` (newest-first for display) is walked backwards.
  for (;;) {
    const next = [...items]
      .reverse()
      .find(item => item.state === 'queued' && item.nextAttemptAt <= Date.now());

    if (!next) {
      return;
    }

    const outcome = await uploadOne(next);
    if (outcome === 'retry' || outcome === 'paused') {
      return;
    }
  }
}

/** Single-flight. Uploads are large and a weak link only gets slower in parallel. */
export function drainQueue(): Promise<void> {
  if (draining) {
    return draining;
  }

  draining = runDrain()
    .catch(() => {
      // A throw must not wedge the queue shut; the next trigger picks the items up.
    })
    .finally(() => {
      draining = null;
      scheduleNextAttempt();
    });

  return draining;
}

// Fire-and-forget. drainQueue swallows its own failures and no caller needs the outcome.
function startDrain(): void {
  drainQueue();
}

/** Timestamp plus randomness: unique per report, and it doubles as the dedupe key. */
function createLocalId(): string {
  return `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Resolves once the photo is stored, not once it is uploaded. @throws {QueueFullError} */
export async function enqueueReport(fields: QueueReportFields): Promise<QueuedReport> {
  await hydrate();

  if (items.length >= REPORT_QUEUE_MAX) {
    throw new QueueFullError();
  }

  const localId = createLocalId();
  // Photo first: an entry pointing at missing bytes retries forever, an orphan is pruned.
  await persistPhoto(localId, fields.photo);

  const queued: QueuedReport = {
    localId,
    description: fields.description,
    latitude: fields.latitude,
    longitude: fields.longitude,
    state: 'queued',
    attempts: 0,
    nextAttemptAt: 0,
    createdAt: new Date().toISOString(),
  };

  await commit([queued, ...items]);
  startDrain();

  return queued;
}

/** Clears a failed item and its photo. Backs "delete" on the X-05 variant. */
export async function discardQueuedReport(localId: string): Promise<void> {
  await hydrate();
  await drop(localId);
}

/** Manual send. Resets the backoff, since the farmer is telling us to try now. */
export async function retryQueuedReport(localId: string): Promise<void> {
  await hydrate();
  await patch(localId, { state: 'queued', attempts: 0, nextAttemptAt: 0 });
  await drainQueue();
}

/** Server id of a report delivered this session, or null. Non-consuming: subscribers read after. */
export function getDeliveredReportId(localId: string): string | null {
  return delivered.get(localId) ?? null;
}

export function getQueueSnapshot(): QueueSnapshot {
  return snapshot();
}

export function subscribeToQueue(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Attaches drain triggers and reloads last session's items. Safe to call twice. */
export function startReportQueue(): void {
  if (started) {
    return;
  }
  started = true;

  onConnectivityChange(state => {
    // `isInternetReachable` is null while unknown, which is not a reason not to try.
    const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
    const cameBack = online && !isOnline;
    isOnline = online;
    emit();

    if (cameBack) {
      startDrain();
    }
  });

  // NetInfo misses this: backgrounded on a dead link, foregrounded with the radio up.
  AppState.addEventListener('change', status => {
    if (status === 'active') {
      startDrain();
    }
  });

  startDrain();
}

/** Test seam. Nothing in the app calls this. */
export async function resetReportQueue(): Promise<void> {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  items = [];
  isOnline = true;
  hydrated = false;
  started = false;
  draining = null;
  rejectedToken = null;
  listeners.clear();
  await AsyncStorage.removeItem(INDEX_KEY);
}
