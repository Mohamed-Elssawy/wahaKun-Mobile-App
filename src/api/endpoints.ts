/** Paths are verbatim: ASP.NET matches routes exactly, backend typos and casing included. */
export const API_ENDPOINTS = {
  auth: {
    register: '/Auth/Register',
    createExpert: '/Auth/CreateExpert',
    loginWithEmail: '/Auth/LoginWithEmail',
    firebaseLogin: '/Auth/firebase-login',
    forgetPassword: '/Auth/ForgetPassword',
    resetPassword: '/Auth/ResetPassword',
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
  report: {
    create: '/Report/create',
    analyze: (reportId: string) => `/Report/AnalyzeReport?id=${reportId}`,
    byId: (reportId: string) => `/Report/GetReportById?id=${reportId}`,
    myReports: '/Report/GetMyReports',
    all: '/Report/GetAllReports',
    delete: (reportId: string) => `/Report/DeleteReport?id=${reportId}`,
  },
  storage: {
    /** No [Authorize], which is what lets an <Image> src point straight at it. */
    download: (objectName: string) =>
      `/storage?objectName=${encodeURIComponent(objectName)}`,
  },
} as const;
