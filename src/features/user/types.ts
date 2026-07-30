/** Field names mirror the C# DTOs in UserService exactly. */
export type UserUpdateRequest = {
  FullName?: string;
  village?: string;
  Region?: string;
  picture?: string;
  email?: string;
  PhoneNumber?: string;
};

/** All optional: the backend publishes no response DTO for /User/details yet. */
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
