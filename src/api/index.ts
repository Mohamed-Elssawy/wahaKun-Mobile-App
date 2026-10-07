export { apiClient } from './client';
export type { HttpMethod, RequestOptions } from './client';


export {
  emptyOnEmptyScenario,
  failOnErrorScenario,
  isEmptyScenario,
  mockDelay,
  mockLatency,
} from './mockScenario';

export { ApiError, NETWORK_ERROR_STATUS, getErrorMessage } from './errors';
export type { ApiErrorDetails } from './errors';
export type { ApiErrorKind } from './errorMessages';
export { CODE_MESSAGES, STATUS_MESSAGES } from './errorMessages';
export { API_ENDPOINTS } from './endpoints';
export { saveTokens, getAccessToken, getRefreshToken, clearTokens, onTokensCleared } from './tokenStorage';
export { getTokenUserId, loadTokenClaims, readTokenClaims } from './jwt';
export type { TokenClaims } from './jwt';
export { expireSession, getValidAccessToken, isTokenExpired, onSessionExpired, onSessionRefreshed, refreshSession, refreshSessionOutcome } from './session';
export type { RefreshOutcome } from './session';