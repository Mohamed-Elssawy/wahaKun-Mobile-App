/** The behaviour every feature mock shares, so MOCK_SCENARIO walks all four UI states. */
// It lives in api/ rather than config/ because it fabricates ApiError, and config must not
// import api: api/client.ts already reads config/env, and the reverse edge would be a cycle.
import { MOCK_SCENARIO } from '@/config/env';

import { ApiError, NETWORK_ERROR_STATUS } from './errors';

/** Long enough that a loading state is actually visible on a device, not a flash. */
const SLOW_LATENCY_MS = 6000;

export function isEmptyScenario(): boolean {
  return MOCK_SCENARIO === 'empty';
}

/** `slow` stretches every mock call so the spinner can be photographed. */
export function mockLatency(baseMs: number): number {
  return MOCK_SCENARIO === 'slow' ? SLOW_LATENCY_MS : baseMs;
}

export function mockDelay(baseMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, mockLatency(baseMs)));
}

/**
 * Throws under `error`, as a network failure rather than a 4xx: the offline frame is the one
 * every screen designs for, and describeError maps status 0 onto it.
 */
export function failOnErrorScenario(message: string): void {
  if (MOCK_SCENARIO === 'error') {
    throw new ApiError(NETWORK_ERROR_STATUS, 'network', message);
  }
}

/** Empties any collection a mock is about to return, so the empty frame is reachable. */
export function emptyOnEmptyScenario<T>(rows: readonly T[]): readonly T[] {
  return isEmptyScenario() ? [] : rows;
}
