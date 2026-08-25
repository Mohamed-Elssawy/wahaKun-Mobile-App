import { Platform } from 'react-native';

import { HOST_OVERRIDE } from './env.local';

const DEFAULT_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
}) as string;

export const HOST = HOST_OVERRIDE ?? DEFAULT_HOST;

export const API_BASE_URLS = {
  auth: `${HOST}/auth/api`,
  user: `${HOST}/user/api`,
  notification: `${HOST}/notification/api`,
  report: `${HOST}/report/api`,
  media: `${HOST}/media/api`,
} as const;

export const API_TIMEOUT_MS = 15000;

export const UPLOAD_TIMEOUT_MS = 60000;

export const REPORT_QUEUE_MAX = 5;

export const USE_MOCK_REPORTS = false;

export const ESCALATE_LOW_CONFIDENCE = false;