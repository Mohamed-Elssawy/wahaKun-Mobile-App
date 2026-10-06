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
    media: 5230, community: 5087, map: 5249, issue: 5195,
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

export const APP_URL_SCHEME = 'wahakun';
export const RESET_PASSWORD_PATH = 'reset-password';
export const RESET_PASSWORD_CLIENT_URL = `${APP_URL_SCHEME}://${RESET_PASSWORD_PATH}`;

export const API_TIMEOUT_MS = 20000;
export const UPLOAD_TIMEOUT_MS = 110000;

/** A storage budget, not a UX limit: each queued report holds a photo in AsyncStorage. */
export const REPORT_QUEUE_MAX = 5;

/** The master switch for a demo with no backend running. Forces every feature onto its mock. */
// Deliberately above the per-feature flags: each ORs against it, so one edit moves the whole app.
export const DEMO_MODE = false;

/** Flip to true to work on the diagnosis screens with no backend running. */
export const USE_MOCK_REPORTS = DEMO_MODE || false;

/** Mirrors this device's reports locally. On because IssueController has no GetMyIssues/GetIssueById. */
export const USE_LOCAL_REPORT_MIRROR = true;

/** F-06. On by backend gap, not choice: IssueController has no read endpoint at all yet, so
 * nothing - expert, appointment, repair, the confirm/reject writes - has anywhere real to go. */
export const USE_MOCK_TRACKER = DEMO_MODE || true;

/** Seeded feed. CommunityService has no feed endpoint, and the MapService fallback has no author or counts. */
export const USE_MOCK_COMMUNITY = DEMO_MODE || true;

/** A signed-in farmer with no AuthService. Without it DEMO_MODE has no identity to show. */
export const USE_MOCK_USER = DEMO_MODE || false;

/** Posting a comment needs the moderation AI on :8000, which is not in the backend repo. */
// The mock moderates nothing, so a demo can post; the real path still needs :8000 up.
export const ENABLE_COMMENT_POSTING = DEMO_MODE || false;

/** On by SYSTEM-SPEC T2: below 80% the farmer gets the escalation line and no AI output. */
// The expert still sees the amber chip on E-01, which is the only sub-threshold view anywhere.
export const ESCALATE_LOW_CONFIDENCE = true;

/** Mirrors UserRole, redeclared because config/ imports nothing from features/ (ARCHITECTURE). */
export type MockRole = 'farmer' | 'expert';

/** §4.1's four expert destinations. The backend's UserStatus has exactly these, numbered 1-4. */
export type MockApproval = 'approved' | 'pending' | 'rejected' | 'suspended';

/** On by backend gap: UserDetailsResponse carries no role, so there is nothing real to read. */
// Identity roles do exist in AuthService, but only inside the JWT, which is a separate request.
export const USE_MOCK_ROLE = DEMO_MODE || true;

/** Farmer by default, so the committed build and DEMO_MODE both boot the farmer shell. */
// Set to 'expert' with MOCK_EXPERT_APPROVAL 'approved' to walk the expert shell on a device.
export const MOCK_ROLE: MockRole = 'farmer';

export const MOCK_EXPERT_APPROVAL: MockApproval = 'approved';

/** §8.3. On by backend gap, not choice: IssueController has no assigned-cases list, no
 * review-submit and no override write, so the whole expert queue has nowhere real to go. */
export const USE_MOCK_EXPERT_QUEUE = DEMO_MODE || true;

/** §8.3's E-09. On by backend gap: no chat endpoint exists at all yet. Independent of
 * USE_MOCK_EXPERT_QUEUE - E-10 and the rest of chat are a separate unit from the case queue. */
export const USE_MOCK_EXPERT_CHATS = DEMO_MODE || true;

/** Which state every mock serves, so loading, empty and error can be walked on a device. */
export type MockScenario = 'content' | 'empty' | 'error' | 'slow';

// A build-time constant rather than a dev menu: the mocks are module scope and have no UI.
export const MOCK_SCENARIO: MockScenario = 'content';

export const LOG_API_ERRORS = __DEV__;
