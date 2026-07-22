/**
 * Request/response shapes for AuthService.
 *
 * Field names mirror the C# DTOs in AuthService/Auth.Shared/DTOS exactly.
 * ASP.NET model binding is case-sensitive for records, so the backend's typos
 * are reproduced deliberately: `refershtoken`, `FulltName`, `ClinetUrl`,
 * `ConfemedPassword`. Do not correct them here — they can only be fixed in the
 * backend, and this client must match what it currently serves.
 */

/** A picked image, e.g. react-native-image-picker's response.assets[0]. */
export type PickedImage = {
  uri: string;
  type?: string;
  fileName?: string;
};

/**
 * RegisterRequest is [FromForm] on the backend (picture is an IFormFile), so
 * register() and createExpert() take FormData built by buildRegisterFormData.
 */
export type RegisterFields = {
  FullName: string;
  village: string;
  Region: string;
  email: string;
  password: string;
  PhoneNumber: string;
  picture?: PickedImage | null;
};

export type OtpResponse = {
  success: boolean;
  message: string;
};

export type VerifyOtpRequest = {
  phonenumber: string;
  otp: string;
};

export type UserResponse = {
  accesstoken?: string;
  /** Backend spells this "refershtoken". */
  refershtoken?: string;
  FullName: string;
  message: string;
};

export type LoginWithEmailRequest = {
  Email: string;
  Password: string;
};

export type LoginWithEmailResponse = {
  /** Backend spells this "FulltName". */
  FulltName: string;
  refreshToken?: string;
  accessToken?: string;
  email: string;
};

/** The two account types that can self-register from the mobile app. */
export type UserRole = 'farmer' | 'expert';
