import { Platform } from 'react-native';

import { API_GATEWAY_URL_OVERRIDE, API_MODE_OVERRIDE, HOST_OVERRIDE } from './env.local';

export type ApiMode = 'gateway' | 'direct';

export const API_MODE: ApiMode = API_MODE_OVERRIDE ?? 'gateway';

const DEFAULT_HOST = Platform.select({
    android: '10.0.2.2',
    ios: 'localhost',
    default: 'localhost',
}) as string;

export const HOST = HOST_OVERRIDE ?? DEFAULT_HOST;

function normalizeOrigin(url: string): string {
    const trimmed = url.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

export const API_GATEWAY_URL = normalizeOrigin(
    API_GATEWAY_URL_OVERRIDE ?? `http://${DEFAULT_HOST}:30000`,
);

export const PORTS = {
    auth: 5090, user: 5256, notification: 5140, report: 5173,
    media: 5230, community: 5087, map: 5249,
} as const;

type ServiceName = keyof typeof PORTS;

function baseUrlFor(service: ServiceName): string {
    if (API_MODE === 'direct') {
        return `http://${HOST}:${PORTS[service]}/api`;
    }
    return `${API_GATEWAY_URL}/api`;
}

export const API_BASE_URLS = {
    auth: baseUrlFor('auth'),
    user: baseUrlFor('user'),
    notification: baseUrlFor('notification'),
    report: baseUrlFor('report'),
    community: baseUrlFor('community'),
    media: baseUrlFor('media'),
    map: baseUrlFor('map'),
} as const;

export const APP_URL_SCHEME = 'wahakun';
export const RESET_PASSWORD_PATH = 'reset-password';
export const RESET_PASSWORD_CLIENT_URL = `${APP_URL_SCHEME}://${RESET_PASSWORD_PATH}`;

export const API_TIMEOUT_MS = 20000;
export const UPLOAD_TIMEOUT_MS = 110000;
export const REPORT_QUEUE_MAX = 5;
export const USE_MOCK_REPORTS = false;
export const USE_LOCAL_REPORT_MIRROR = true;
export const USE_MOCK_COMMUNITY = false;
export const ENABLE_COMMENT_POSTING = false;
export const ESCALATE_LOW_CONFIDENCE = false;
export const LOG_API_ERRORS = __DEV__;