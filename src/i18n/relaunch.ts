// The only import site of `react-native-restart` - keep out of i18n/index.ts, enforced by scripts/__tests__/native-import-graph.test.js.

import RNRestart from 'react-native-restart';

import { FORCE_LANGUAGE_FAILURE } from '@/config/env';

import type { Locale } from './locale';

/** `absent`: module not linked, throws synchronously. `ineffective`: linked but the process doesn't die, caught only by a timer. */
export type RelaunchFailure = 'absent' | 'ineffective';

/** The locale being switched to, which is the one the relaunch screen is written in. */
type Listener = (target: Locale) => void;

const listeners = new Set<Listener>();

/** Swaps the relaunch screen in above the navigator; a module-level subscription, same shape as `onSessionExpired`. */
export function requireRelaunch(target: Locale): void {
  for (const listener of listeners) {
    listener(target);
  }
}

export function onRelaunchRequired(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Kills and relaunches the process via ProcessPhoenix; returns while teardown is still async, which is not failure. */
export function relaunchApp(): void {
  // Dev-only, from the gitignored env.local.ts, so both fallback triggers can be walked on a device.
  if (FORCE_LANGUAGE_FAILURE === 'relaunchSilent') {
    return;
  }
  if (FORCE_LANGUAGE_FAILURE === 'relaunchThrows') {
    throw new Error('FORCE_LANGUAGE_FAILURE: relaunchThrows');
  }

  RNRestart.restart();
}
