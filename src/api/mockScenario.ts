/** The behaviour every feature mock shares. In api/ because config must not import api. */
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

/** Throws as a network failure, since the offline frame is the one every screen designs for. */
export function failOnErrorScenario(message: string): void {
  if (MOCK_SCENARIO === 'error') {
    throw new ApiError(NETWORK_ERROR_STATUS, 'network', message);
  }
}

/** Empties any collection a mock is about to return, so the empty frame is reachable. */
export function emptyOnEmptyScenario<T>(rows: readonly T[]): readonly T[] {
  return isEmptyScenario() ? [] : rows;
}
