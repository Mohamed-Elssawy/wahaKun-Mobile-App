/**
 * All calls to UserService. Every call here requires the user to be logged
 * in (authenticated: true attaches the saved Bearer access token).
 */
import { API_BASE_URLS, API_ENDPOINTS } from '../config/api';
import { apiClient } from './apiClient';

const BASE = API_BASE_URLS.user;

export type UserUpdateRequest = {
  FullName?: string;
  village?: string;
  Region?: string;
  picture?: string;
  email?: string;
  PhoneNumber?: string;
};

export function getUserDetails() {
  return apiClient.get(BASE, API_ENDPOINTS.user.details, { authenticated: true });
}

export function getAllUserDetails() {
  return apiClient.get(BASE, API_ENDPOINTS.user.all, { authenticated: true });
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
