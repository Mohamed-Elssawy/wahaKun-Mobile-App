// camelCase, not the C# casing: AddControllers() renames every property, so PascalCase reads undefined.

import type { UserRole } from '@/features/auth/types';
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
  /** PROPOSED. Roles live in AuthService's Identity tables; no UserService DTO returns one. */
  role?: UserRole;
  /** PROPOSED. AppUser.Status is set to Pending on expert register but reaches no response. */
  status?: ExpertApproval | ExpertApprovalCode;
};

/** §4.1's four expert destinations, and the backend's UserStatus names, which agree exactly. */
export type ExpertApproval = 'approved' | 'pending' | 'rejected' | 'suspended';

/** UserStatus in C#: Approved=1, Pending=2, Rejected=3, Suspended=4, and an int on the wire. */
export type ExpertApprovalCode = 1 | 2 | 3 | 4;

/** Who the signed-in account is, which is all §4.1's routing table needs. */
export type RoleIdentity = {
  role: UserRole;
  /** Always 'approved' for a farmer: §4.1 only gates experts. */
  approval: ExpertApproval;
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
