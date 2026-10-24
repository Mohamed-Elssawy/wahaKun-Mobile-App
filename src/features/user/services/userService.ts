/** Every UserService call needs a login, hence `authenticated: true` throughout. */
import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS, UPLOAD_TIMEOUT_MS } from '@/config/env';
import {
  isLoadableUri,
  localPhotoUri,
  refreshLocalPhotos,
  rememberUploadedPhoto,
  resolveAttachmentUrl,
  STORAGE_SERVES_BYTES,
} from '@/features/reports/services/reportService';
import type { PickedImage } from '@/types/image';

import type {
  UploadFileResponse,
  UserApi,
  UserDetails,
  UserUpdateRequest,
} from '../types';

const BASE = API_BASE_URLS.user;

const NO_USER_BY_ID_ENDPOINT =
  'GET /User/GetUser/{userId} does not exist; there is no way to resolve another account by id.';

/** No argument reads the signed-in farmer; the read-anyone endpoint was never real. */
export async function getUserDetails(userId?: string) {
  if (userId) {
    return Promise.reject(new Error(NO_USER_BY_ID_ENDPOINT));
  }

  // resolveProfilePictureUrl is synchronous, so the index behind it must be fresh first.
  await refreshLocalPhotos();

  return apiClient.get<UserDetails>(BASE, API_ENDPOINTS.user.details, {
    authenticated: true,
  });
}

export function updateUserDetails(payload: UserUpdateRequest) {
  return apiClient.put<void>(BASE, API_ENDPOINTS.user.update, payload, {
    authenticated: true,
  });
}

/** Where MediaStorage files an avatar. It becomes the first segment of the object key. */
const AVATAR_FOLDER = 'profile-pictures';

/** MediaStorage owns the bytes; User/update only ever stores the key this returns. */
export async function uploadProfilePicture(image: PickedImage): Promise<string> {
  const formData = new FormData();
  // A name whose extension disagrees with `type` makes servers store the wrong format.
  formData.append('file', {
    uri: image.uri,
    type: image.type || 'image/jpeg',
    name: image.fileName || 'avatar.jpg',
  } as unknown as Blob);

  const result = await apiClient.post<UploadFileResponse>(
    API_BASE_URLS.media,
    API_ENDPOINTS.storage.upload(AVATAR_FOLDER),
    formData,
    { authenticated: true, timeoutMs: UPLOAD_TIMEOUT_MS },
  );

  // The one moment the key and the device's own file are both in hand.
  await rememberUploadedPhoto(result.filePath, image.uri);

  return result.filePath;
}

/** The storage URL an avatar key resolves to; its own folder, so stripping is a fallback. */
export function profilePictureStorageUrl(value: string): string {
  if (!value.startsWith(`${AVATAR_FOLDER}/`)) {
    return resolveAttachmentUrl(value);
  }

  return `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download(value)}`;
}

/** A URI passes through, then this device's file, then storage once it serves bytes. */
export function resolveProfilePictureUrl(value: string): string | undefined {
  if (isLoadableUri(value)) {
    return value;
  }

  const local = localPhotoUri(value);
  if (local) {
    return local;
  }

  return STORAGE_SERVES_BYTES ? profilePictureStorageUrl(value) : undefined;
}

export const userApi: UserApi = {
  getUserDetails,
  updateUserDetails,
  uploadProfilePicture,
};
