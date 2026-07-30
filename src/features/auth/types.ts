// Backend typos are reproduced on purpose: ASP.NET binds records case-sensitively.
import type { PickedImage } from '@/types/image';

/** Sent as FormData, since RegisterRequest is [FromForm] with an IFormFile picture. */
export type RegisterFields = {
  FullName: string;
  village: string;
  Region: string;
  email: string;
  password: string;
  PhoneNumber: string;
  picture?: PickedImage | null;
};

export type LoginWithEmailRequest = {
  Email: string;
  Password: string;
};

export type LoginWithEmailResponse = {
  FulltName: string;
  refreshToken?: string;
  accessToken?: string;
  email: string;
};

/** Returned by both /Auth/Register and /Auth/firebase-login since the OTP step was dropped. */
export type FirebaseLoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  /** Unusable: the server sets it to UtcNow while the token is good for an hour. */
  accessTokenExpiration?: string;
  refreshTokenExpiration?: string;
};

/** The two account types that can self-register from the mobile app. */
export type UserRole = 'farmer' | 'expert';
