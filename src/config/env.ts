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

/** Each service's own port behind the gateway. Not used in request URLs; kept for reference. */
export const PORTS = {
  auth: 5090,
  user: 5256,
  notification: 5140,
  report: 5173,
  media: 5230,
  community: 5087,
  map: 5249,
} as const;

/**
 * One shared base for every service. The deployed gateway (Traefik via ngrok) dispatches
 * `/api/<Controller>/<Action>` straight to the right service by controller name; a
 * per-service path prefix (`/map/api/...`, `/community/api/...`) is not wired for every
 * service and 404s at the gateway for Map and Community. Verified live against all
 * seven services before switching every key to this.
 */
export const API_BASE_URLS = {
  auth: `${HOST}/api`,
  user: `${HOST}/api`,
  notification: `${HOST}/api`,
  report: `${HOST}/api`,
  community: `${HOST}/api`,
  map: `${HOST}/api`,
  /** Only used to render attachments; no client call goes through apiClient. */
  media: `${HOST}/api`,
} as const;

/** Registered natively in AndroidManifest.xml and Info.plist; changing it needs a rebuild. */
// A custom scheme, not https: there is no web client for the emailed link to land on.
export const APP_URL_SCHEME = 'wahakun';

/** The deep link's host. navigation/linking.ts maps it onto the ResetPassword route. */
export const RESET_PASSWORD_PATH = 'reset-password';

/** Sent to AuthService as ClinetUrl; it appends ?token=...&email=... to this. */
export const RESET_PASSWORD_CLIENT_URL = `${APP_URL_SCHEME}://${RESET_PASSWORD_PATH}`;

export const API_TIMEOUT_MS = 15000;

/** 15s is right for JSON and wrong for multipart; aborting mid-write makes duplicates. */
export const UPLOAD_TIMEOUT_MS = 60000;

/** A storage budget, not a UX limit: each queued report holds a photo in AsyncStorage. */
export const REPORT_QUEUE_MAX = 5;

/** Flip to true to work on the diagnosis screens with no backend running. */
export const USE_MOCK_REPORTS = false;

/** Mirrors this device's reports locally. On because IssueController has no GetMyIssues/GetIssueById. */
export const USE_LOCAL_REPORT_MIRROR = true;

/** Posting a comment needs the moderation AI on :8000, which is not in the backend repo. */
export const ENABLE_COMMENT_POSTING = false;

/** Off by product decision: the farmer sees the diagnosis whatever the confidence. */
export const ESCALATE_LOW_CONFIDENCE = false;
