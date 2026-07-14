/**
 * All calls to AuthService (Register, Login, OTP, tokens...).
 * Field names match the C# DTOs in AuthService/Auth.Shared/DTOS exactly,
 * since ASP.NET model binding is case-sensitive by default for records.
 */
import { API_BASE_URLS, API_ENDPOINTS } from '../config/api';
import { apiClient } from './apiClient';

const BASE = API_BASE_URLS.auth;

// ---- Request/response shapes (mirrors the backend DTOs) -------------------

/**
 * RegisterRequest is now [FromForm] on the backend (picture is an
 * IFormFile), so both register() and createExpert() take a FormData built
 * with buildRegisterFormData() below instead of a plain JS object.
 */
export type RegisterFields = {
  FullName: string;
  village: string;
  Region: string;
  email: string;
  password: string;
  PhoneNumber: string;
  /** A picked image asset, e.g. from react-native-image-picker's response.assets[0]. */
  picture?: { uri: string; type?: string; fileName?: string } | null;
};

export type OTPResponse = {
  success: boolean;
  message: string;
};

export type VerifyOTPRequest = {
  phonenumber: string;
  otp: string;
};

export type UserResponse = {
  accesstoken?: string;
  refershtoken?: string; // note: backend spells this "refershtoken"
  FullName: string;
  message: string;
};

export type LoginWithEmailRequest = {
  Email: string;
  Password: string;
};

export type LoginWithEmailResponse = {
  FulltName: string; // note: backend spells this "FulltName"
  refreshToken?: string;
  accessToken?: string;
  email: string;
};

/**
 * Content-type -> file extension, kept in sync with the backend's
 * AllowedPictureTypes allow-list in AuthService.cs. Used only to pick a
 * sensible fallback filename — the backend re-derives the real extension
 * from the request's declared Content-Type itself, it doesn't trust this.
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
 * /Auth/CreateExpert. The picture, if present, is appended as a real file
 * part (name/type/uri) so the backend can bind it to `IFormFile? picture`.
 *
 * Note: react-native-image-picker (camera/gallery) only ever returns actual
 * photos — typically JPEG, sometimes PNG — never SVG. SVGs aren't "photos",
 * so if you want to let users upload an SVG avatar you'd need a file/document
 * picker (e.g. react-native-document-picker) instead of the image picker.
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
    // Trust the picker's reported mime type first; only fall back to jpeg
    // when it's genuinely missing (some Android gallery apps omit it).
    const mimeType = fields.picture.type || 'image/jpeg';
    const extension = PICTURE_EXTENSIONS[mimeType.toLowerCase()] || 'jpg';

    // React Native's fetch/FormData accepts this {uri, type, name} shape and
    // turns it into a real file part of the multipart request. The `name`'s
    // extension should match `type` — a mismatched pair (e.g. a .jpg name
    // with a png mime type) is what usually causes servers to save the file
    // under the wrong format.
    formData.append('picture', {
      uri: fields.picture.uri,
      type: mimeType,
      name: fields.picture.fileName || `photo.${extension}`,
    } as any);
  }

  return formData;
}

// ---- API calls --------------------------------------------------------

/** Farmer self sign-up. Sends an OTP to the phone number provided. */
export function register(formData: FormData) {
  return apiClient.post<OTPResponse>(BASE, API_ENDPOINTS.auth.register, formData);
}

/** Expert sign-up. Account is created as "Pending" until an admin approves it. No OTP step. */
export function createExpert(formData: FormData) {
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.createExpert, formData);
}

/** Login by phone number. Sends an OTP to that number if the user exists. */
export function loginWithPhone(phoneNumber: string) {
  return apiClient.post<OTPResponse>(BASE, API_ENDPOINTS.auth.login, {
    PhoneNumber: phoneNumber,
  });
}

/** Login by email + password. Returns tokens directly (no OTP step). */
export function loginWithEmail(email: string, password: string) {
  return apiClient.post<LoginWithEmailResponse>(BASE, API_ENDPOINTS.auth.loginWithEmail, {
    Email: email,
    Password: password,
  } as LoginWithEmailRequest);
}

/** Confirms the OTP code for either registration or phone-login. Returns tokens. */
export function verifyOtp(phoneNumber: string, otp: string) {
  return apiClient.post<UserResponse>(BASE, API_ENDPOINTS.auth.verifyOtp, {
    phonenumber: phoneNumber,
    otp,
  } as VerifyOTPRequest);
}

export function forgetPassword(email: string, clientUrl: string) {
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.forgetPassword, {
    Email: email,
    ClinetUrl: clientUrl, // note: backend spells this "ClinetUrl"
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
    ConfemedPassword: confirmedPassword, // note: backend spells this "ConfemedPassword"
  });
}

export function refreshToken(refreshTokenValue: string) {
  return apiClient.post<LoginWithEmailResponse>(BASE, API_ENDPOINTS.auth.refreshToken, {
    RefreshToken: refreshTokenValue,
  });
}

export function logout(refreshTokenValue: string) {
  // Backend expects a raw string body ([FromBody] string refreshToken)
  return apiClient.post<void>(BASE, API_ENDPOINTS.auth.logout, refreshTokenValue);
}
