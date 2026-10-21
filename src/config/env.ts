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
  auth: 5090,
  user: 5256,
  notification: 5140,
  report: 5173,
  media: 5230,
  community: 5087,
  map: 5249,
  issue: 5195,
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
  issue: baseUrlFor('issue'),
} as const;

/** Hubs sit at the service root, not under /api, so gateway mode must route /hubs/* and upgrades. */
function hubUrlFor(service: ServiceName, path: string): string {
  if (API_MODE === 'direct') {
    return `http://${HOST}:${PORTS[service]}${path}`;
  }
  return `${API_GATEWAY_URL}${path}`;
}

export const HUB_URLS = {
  community: hubUrlFor('community', '/hubs/community'),
} as const;

export const APP_URL_SCHEME = 'wahakun';
export const RESET_PASSWORD_PATH = 'reset-password';
export const RESET_PASSWORD_CLIENT_URL = `${APP_URL_SCHEME}://${RESET_PASSWORD_PATH}`;

export const API_TIMEOUT_MS = 20000;
export const UPLOAD_TIMEOUT_MS = 110000;

/** A storage budget, not a UX limit: each queued report holds a photo in AsyncStorage. */
export const REPORT_QUEUE_MAX = 5;

/** The master switch for a demo with no backend: every per-feature flag ORs against it. */
export const DEMO_MODE = false;

/** Flip to true to work on the diagnosis screens with no backend running. */
export const USE_MOCK_REPORTS = DEMO_MODE || false;

/** Holds the reports the backend declines to create, and the local file index behind every photo. */
export const USE_LOCAL_REPORT_MIRROR = true;

/** F-06 is real: GET /Farmer/{id}/tracking answers 200 on a real id and a clean 404 otherwise. */
export const USE_MOCK_TRACKER = DEMO_MODE || false;

/** Seeded feed. CommunityService has no feed endpoint, and the MapService fallback has no author or counts. */
export const USE_MOCK_COMMUNITY = DEMO_MODE || true;

/** A signed-in farmer with no AuthService. Without it DEMO_MODE has no identity to show. */
export const USE_MOCK_USER = DEMO_MODE || false;

/** Posting needs the moderation AI on :8000, which is not in the backend repo. */
export const ENABLE_COMMENT_POSTING = DEMO_MODE || false;

/** T2: below 80% the farmer gets the escalation line, while the expert still sees the chip. */
export const ESCALATE_LOW_CONFIDENCE = true;

/** Mirrors UserRole, redeclared because config/ imports nothing from features/ (ARCHITECTURE). */
export type MockRole = 'farmer' | 'expert';

/** §4.1's four expert destinations. The backend's UserStatus has exactly these, numbered 1-4. */
export type MockApproval = 'approved' | 'pending' | 'rejected' | 'suspended';

/** Off: the role comes from the token's ClaimTypes.Role claim, not UserDetailsResponse. */
export const USE_MOCK_ROLE = DEMO_MODE || false;

/** Farmer by default; set to expert with MOCK_EXPERT_APPROVAL approved to walk the expert shell. */
export const MOCK_ROLE: MockRole = 'farmer';

export const MOCK_EXPERT_APPROVAL: MockApproval = 'approved';

/** Off: ExpertController serves the inbox, the review and all three writes. Notes carry G3. */
export const USE_MOCK_EXPERT_QUEUE = DEMO_MODE || false;

/** On by backend gap: no chat endpoint exists, and chat is a separate unit from the queue. */
export const USE_MOCK_EXPERT_CHATS = DEMO_MODE || true;

/** On by backend gap: NotificationService has no route the app has ever found. */
export const USE_MOCK_NOTIFICATIONS = DEMO_MODE || true;

/** Which state every mock serves, so loading, empty and error can be walked on a device. */
export type MockScenario = 'content' | 'empty' | 'error' | 'slow';

// A build-time constant rather than a dev menu: the mocks are module scope and have no UI.
export const MOCK_SCENARIO: MockScenario = 'content';

export const LOG_API_ERRORS = __DEV__;
