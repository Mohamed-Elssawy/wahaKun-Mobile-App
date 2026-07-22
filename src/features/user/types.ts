/** Field names mirror the C# DTOs in UserService exactly. */
export type UserUpdateRequest = {
  FullName?: string;
  village?: string;
  Region?: string;
  picture?: string;
  email?: string;
  PhoneNumber?: string;
};

/**
 * Shape returned by /User/details. The backend publishes no formal response
 * DTO for this yet, so every field is optional until it does.
 */
export type UserDetails = {
  id?: string;
  FullName?: string;
  email?: string;
  PhoneNumber?: string;
  Region?: string;
  village?: string;
  picture?: string;
  role?: string;
  status?: string;
};
