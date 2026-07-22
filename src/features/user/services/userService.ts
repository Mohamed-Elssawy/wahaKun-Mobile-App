/**
 * All calls to UserService. Every call requires the user to be logged in —
 * `authenticated: true` attaches the saved bearer access token.
 */
import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';

import type { UserDetails, UserUpdateRequest } from '../types';

const BASE = API_BASE_URLS.user;

export function getUserDetails() {
  return apiClient.get<UserDetails>(BASE, API_ENDPOINTS.user.details, {
    authenticated: true,
  });
}

export function getAllUserDetails() {
  return apiClient.get<UserDetails[]>(BASE, API_ENDPOINTS.user.all, {
    authenticated: true,
  });
}

export function updateUserDetails(payload: UserUpdateRequest) {
  return apiClient.put<void>(BASE, API_ENDPOINTS.user.update, payload, {
    authenticated: true,
  });
}

export function blockUser(userId: string) {
  return apiClient.put<void>(BASE, API_ENDPOINTS.user.block(userId), undefined, {
    authenticated: true,
  });
}

export function approveUser(userId: string) {
  return apiClient.put<void>(BASE, API_ENDPOINTS.user.approve(userId), undefined, {
    authenticated: true,
  });
}

export function deleteUser(userId: string) {
  return apiClient.delete<void>(BASE, API_ENDPOINTS.user.delete(userId), {
    authenticated: true,
  });
}
