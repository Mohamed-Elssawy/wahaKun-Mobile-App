/**
 * All calls to AuthService (Register, Login, OTP, tokens).
 *
 * See ../types.ts for why several field names look misspelled — they match the
 * backend DTOs verbatim and must not be corrected here.
 */
import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';

import type {
  LoginWithEmailRequest,
  LoginWithEmailResponse,
  OtpResponse,
  RegisterFields,
  UserResponse,
  VerifyOtpRequest,
} from '../types';

const BASE = API_BASE_URLS.auth;

/**
 * Content-type -> extension, kept in sync with the backend's
 * AllowedPictureTypes allow-list in AuthService.cs. Only used to pick a
 * sensible fallback filename — the backend re-derives the real extension from
 * the declared Content-Type and does not trust this.
 */
const PICTURE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/**
 * Builds the multipart/form-data body for /Auth/Register and
 * /Auth/CreateExpert. The picture, when present, is appended as a real file
 * part so the backend can bind it to `IFormFile? picture`.
 */
export function buildRegisterFormData(fields: RegisterFields): FormData {
  const formData = new FormData();
  formData.append('FullName', fields.FullName);
  formData.append('PhoneNumber', fields.PhoneNumber);
  formData.append('email', fields.email);
  formData.append('password', fields.password);
  formData.append('Region', fields.Region);
  formData.append('village', fields.village);

  if (fields.picture?.uri) {
    // Trust the picker's reported mime type; only fall back to jpeg when it is
    // genuinely missing (some Android gallery apps omit it).
    const mimeType = fields.picture.type || 'image/jpeg';
    const extension = PICTURE_EXTENSIONS[mimeType.toLowerCase()] || 'jpg';

    // React Native's FormData turns this {uri, type, name} shape into a real
    // file part. The name's extension must agree with `type` — a mismatched
    // pair is what usually makes servers store the file in the wrong format.
    formData.append('picture', {
      uri: fields.picture.uri,
      type: mimeType,
      name: fields.picture.fileName || `photo.${extension}`,
    } as unknown as Blob);
  }

  return formData;
}

/** Farmer self sign-up. Sends an OTP to the phone number provided. */
export function register(formData: FormData) {
  return apiClient.post<OtpResponse>(BASE, API_ENDPOINTS.auth.register, formData);
}

/** Expert sign-up. Created as "Pending" until an admin approves it. No OTP step. */
export function createExpert(formData: FormData) {
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.createExpert, formData);
}

/** Login by phone number. Sends an OTP to that number if the user exists. */
export function loginWithPhone(phoneNumber: string) {
  return apiClient.post<OtpResponse>(BASE, API_ENDPOINTS.auth.login, {
    PhoneNumber: phoneNumber,
  });
}

/** Login by email + password. Returns tokens directly (no OTP step). */
export function loginWithEmail(email: string, password: string) {
  const payload: LoginWithEmailRequest = { Email: email, Password: password };
  return apiClient.post<LoginWithEmailResponse>(
    BASE,
    API_ENDPOINTS.auth.loginWithEmail,
    payload,
  );
}

/** Confirms the OTP for either registration or phone-login. Returns tokens. */
export function verifyOtp(phoneNumber: string, otp: string) {
  const payload: VerifyOtpRequest = { phonenumber: phoneNumber, otp };
  return apiClient.post<UserResponse>(BASE, API_ENDPOINTS.auth.verifyOtp, payload);
}

export function forgetPassword(email: string, clientUrl: string) {
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.forgetPassword, {
    Email: email,
    ClinetUrl: clientUrl, // backend spelling
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
    ConfemedPassword: confirmedPassword, // backend spelling
  });
}

export function refreshToken(refreshTokenValue: string) {
  return apiClient.post<LoginWithEmailResponse>(BASE, API_ENDPOINTS.auth.refreshToken, {
    RefreshToken: refreshTokenValue,
  });
}

export function logout(refreshTokenValue: string) {
  // Backend expects a raw string body ([FromBody] string refreshToken).
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.logout, refreshTokenValue);
}
