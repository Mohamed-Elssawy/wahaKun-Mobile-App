/** Every UserService call needs a login, hence `authenticated: true` throughout. */
import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';

import type { UserDetails, UserUpdateRequest } from '../types';

const BASE = API_BASE_URLS.user;

/** No argument reads the signed-in farmer; an id reads anyone, which the feed needs. */
export function getUserDetails(userId?: string) {
  const path = userId ? API_ENDPOINTS.user.byId(userId) : API_ENDPOINTS.user.details;
  return apiClient.get<UserDetails>(BASE, path, { authenticated: true });
}

export function updateUserDetails(payload: UserUpdateRequest) {
  return apiClient.put<void>(BASE, API_ENDPOINTS.user.update, payload, {
    authenticated: true,
  });
}
