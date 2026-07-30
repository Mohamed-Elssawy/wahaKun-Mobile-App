import { Platform } from 'react-native';

import { HOST_OVERRIDE } from './env.local';

// Android emulators reach the host machine at 10.0.2.2; iOS simulators share its stack.
const DEFAULT_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
}) as string;

/** Set HOST_OVERRIDE in env.local.ts to reach the backend from a physical device. */
export const HOST = HOST_OVERRIDE ?? DEFAULT_HOST;

/** Match the http profile in each service's launchSettings.json. */
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

export const API_TIMEOUT_MS = 15000;

/** Serve reports from the in-memory mock: no ReportService instance is reachable yet. */
export const USE_MOCK_REPORTS = true;

/** Off by product decision: the farmer sees the diagnosis whatever the confidence. */
export const ESCALATE_LOW_CONFIDENCE = false;
