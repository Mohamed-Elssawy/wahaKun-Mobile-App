// camelCase, not the C# casing: AddControllers() renames every property, so PascalCase reads undefined.

import type { PickedImage } from '@/types/image';

/** UserUpdateRequest. Every field optional; only what changed should be sent. */
// Binding is case-insensitive server-side, but the response is not, so both stay camelCase.
export type UserUpdateRequest = {
  fullName?: string;
  picture?: string;
  village?: string;
  region?: string;
  phoneNumber?: string;
  email?: string;
};

/** UserDetailsResponse. Non-optional in C#, but a seeded row can still carry "". */
export type UserDetails = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  /** An object key or URL. UserService has no upload endpoint; MediaStorage does. */
  picture: string;
  /** Lowercase in the C# record too, so it survives the rename unchanged. */
  village: string;
  region: string;
};

/** MediaStorageService's UploadFileResponse. `filePath` is the key User/update stores. */
export type UploadFileResponse = {
  fileName: string;
  filePath: string;
  fileUrl: string;
};

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type UserApi = {
  /** No argument reads the signed-in farmer; an id reads anyone, which the feed needs. */
  getUserDetails: (userId?: string) => Promise<UserDetails>;
  updateUserDetails: (payload: UserUpdateRequest) => Promise<void>;
  uploadProfilePicture: (image: PickedImage) => Promise<string>;
};
