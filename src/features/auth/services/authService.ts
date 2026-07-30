/** Field names that look misspelled match the backend DTOs verbatim. See ../types.ts. */
import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';

import type {
  FirebaseLoginResponse,
  LoginWithEmailRequest,
  LoginWithEmailResponse,
  RegisterFields,
} from '../types';

const BASE = API_BASE_URLS.auth;

/** Only picks a fallback filename; the backend re-derives the extension itself. */
const PICTURE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/** Multipart, because the backend binds the picture to `IFormFile? picture`. */
export function buildRegisterFormData(
  fields: RegisterFields,
  idToken?: string,
): FormData {
  const formData = new FormData();
  // RegisterRequest verifies this and takes the phone from it, ignoring the one below.
  if (idToken) {
    formData.append('IdToken', idToken);
  }
  formData.append('FullName', fields.FullName);
  formData.append('PhoneNumber', fields.PhoneNumber);
  formData.append('email', fields.email);
  formData.append('password', fields.password);
  formData.append('Region', fields.Region);
  formData.append('village', fields.village);

  if (fields.picture?.uri) {
    // Some Android gallery apps omit the mime type, and only then is jpeg a guess.
    const mimeType = fields.picture.type || 'image/jpeg';
    const extension = PICTURE_EXTENSIONS[mimeType.toLowerCase()] || 'jpg';

    // A name whose extension disagrees with `type` makes servers store the wrong format.
    formData.append('picture', {
      uri: fields.picture.uri,
      type: mimeType,
      name: fields.picture.fileName || `photo.${extension}`,
    } as unknown as Blob);
  }

  return formData;
}

/** Returns tokens directly: the phone is already verified by the IdToken in the body. */
export function register(formData: FormData) {
  return apiClient.post<FirebaseLoginResponse>(
    BASE,
    API_ENDPOINTS.auth.register,
    formData,
  );
}

/** Created as Pending until an admin approves it, and there is no OTP step. */
export function createExpert(formData: FormData) {
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.createExpert, formData);
}

/** Returns tokens directly, with no OTP step. */
export function loginWithEmail(email: string, password: string) {
  const payload: LoginWithEmailRequest = { Email: email, Password: password };
  return apiClient.post<LoginWithEmailResponse>(
    BASE,
    API_ENDPOINTS.auth.loginWithEmail,
    payload,
  );
}

/** Login only. JSON, because FireBaseLoginDto carries the token and nothing else. */
export function firebaseLogin(idToken: string) {
  return apiClient.post<FirebaseLoginResponse>(BASE, API_ENDPOINTS.auth.firebaseLogin, {
    IdToken: idToken,
  });
}

export function forgetPassword(email: string, clientUrl: string) {
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.forgetPassword, {
    Email: email,
    ClinetUrl: clientUrl,
  });
}

export function resetPassword(
  email: string,
  token: string,
  password: string,
  confirmedPassword: string,
) {
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.resetPassword, {
    Email: email,
    token,
    Password: password,
    ConfemedPassword: confirmedPassword,
  });
}

export function refreshToken(refreshTokenValue: string) {
  return apiClient.post<LoginWithEmailResponse>(BASE, API_ENDPOINTS.auth.refreshToken, {
    RefreshToken: refreshTokenValue,
  });
}

export function logout(refreshTokenValue: string) {
  // The backend binds a raw string here, not an object.
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.logout, refreshTokenValue);
}
