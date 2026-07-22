import { Platform } from 'react-native';

import { HOST_OVERRIDE } from './env.local';

/**
 * Where the .NET backend lives, and how long to wait for it.
 *
 * Defaults target the emulator/simulator so a fresh clone runs with no edits:
 * the Android emulator reaches the host machine's localhost via 10.0.2.2, and
 * the iOS simulator shares the host's network stack.
 *
 * For a physical device set HOST_OVERRIDE to your machine's LAN IP in
 * src/config/env.local.ts, which is gitignored so nobody edits tracked source
 * to run the app.
 */
const DEFAULT_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
}) as string;

export const HOST = HOST_OVERRIDE ?? DEFAULT_HOST;

/**
 * Ports per microservice. These match the `http` profile in each service's
 * launchSettings.json in the backend solution.
 */
export const PORTS = {
  auth: 5090,
  user: 5256,
  notification: 5140,
  report: 5173,
} as const;

export const API_BASE_URLS = {
  auth: `http://${HOST}:${PORTS.auth}/api`,
  user: `http://${HOST}:${PORTS.user}/api`,
  notification: `http://${HOST}:${PORTS.notification}/api`,
  report: `http://${HOST}:${PORTS.report}/api`,
} as const;

/** Generic request timeout (ms). */
export const API_TIMEOUT_MS = 15000;
