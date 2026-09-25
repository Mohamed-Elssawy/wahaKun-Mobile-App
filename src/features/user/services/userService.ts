/** Every UserService call needs a login, hence `authenticated: true` throughout. */
import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS, UPLOAD_TIMEOUT_MS } from '@/config/env';
import { resolveAttachmentUrl } from '@/features/reports/services/reportService';
import type { PickedImage } from '@/types/image';

import type { UploadFileResponse, UserDetails, UserUpdateRequest } from '../types';

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

  return result.filePath;
}

/** Avatars we upload store MediaStorage's objectName verbatim, so it needs no recovery. */
// reportService's resolver assumes the key starts with the bucket name, which is true of
// reports (folder `reportimage`) and false here, so that path is only a fallback.
export function resolveProfilePictureUrl(value: string): string {
  if (!value.startsWith(`${AVATAR_FOLDER}/`)) {
    return resolveAttachmentUrl(value);
  }

  return `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download(value)}`;
}
