/**
 * Endpoint paths, grouped by service/controller.
 *
 * These map 1:1 to the routes on the .NET controllers. Casing and spelling are
 * verbatim: ASP.NET matches routes exactly, and several differ from what you
 * would guess ("Verify-OTP", "Approved"). What each one does is documented on
 * the service function that calls it.
 */
export const API_ENDPOINTS = {
  auth: {
    register: '/Auth/Register',
    createExpert: '/Auth/CreateExpert',
    login: '/Auth/Login',
    loginWithEmail: '/Auth/LoginWithEmail',
    forgetPassword: '/Auth/ForgetPassword',
    resetPassword: '/Auth/ResetPassword',
    verifyOtp: '/Auth/Verify-OTP',
    logout: '/Auth/Logout',
    refreshToken: '/Auth/Refresh-Token',
  },
  user: {
    details: '/User/details',
    all: '/User/all',
    update: '/User/update',
    block: (userId: string) => `/User/Block/${userId}`,
    approve: (userId: string) => `/User/Approved/${userId}`,
    delete: (userId: string) => `/User/Delete/${userId}`,
  },
} as const;
