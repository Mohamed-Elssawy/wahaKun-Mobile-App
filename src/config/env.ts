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

/** Match the http profile in each service's launchSettings.json. */
// Per-service ports, not a gateway: nothing in the backend repo routes /report/api yet.
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

/**
 * One shared base for every service. The deployed gateway (Traefik via ngrok) dispatches
 * `/api/<Controller>/<Action>` straight to the right service by controller name; a
 * per-service path prefix (`/map/api/...`, `/community/api/...`) is not wired for every
 * service and 404s at the gateway for Map and Community. Verified live against all
 * seven services before switching every key to this.
 */
export const API_BASE_URLS = {
  auth: `${HOST}/auth/api`,
  user: `${HOST}/user/api`,
  notification: `${HOST}/notification/api`,
  report: `${HOST}/report/api`,
  community: `${HOST}/community/api`,
  map: `${HOST}/map/api`,
  /** Only used to render attachments; no client call goes through apiClient. */
  media: `${HOST}/media/api`,
} as const;

export const APP_URL_SCHEME = 'wahakun';
export const RESET_PASSWORD_PATH = 'reset-password';
export const RESET_PASSWORD_CLIENT_URL = `${APP_URL_SCHEME}://${RESET_PASSWORD_PATH}`;

export const API_TIMEOUT_MS = 20000;
export const UPLOAD_TIMEOUT_MS = 110000;
export const REPORT_QUEUE_MAX = 5;
export const USE_MOCK_REPORTS = false;
export const USE_LOCAL_REPORT_MIRROR = true;

/** Seeded feed. CommunityService has no feed endpoint, and the MapService fallback has no author or counts. */
export const USE_MOCK_COMMUNITY = true;

/** Posting a comment needs the moderation AI on :8000, which is not in the backend repo. */
export const ENABLE_COMMENT_POSTING = false;
export const ESCALATE_LOW_CONFIDENCE = false;
export const LOG_API_ERRORS = __DEV__;