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
    byId: (userId: string) => `/User/GetUser/${userId}`,
    all: '/User/all',
    update: '/User/update',
    block: (userId: string) => `/User/Block/${userId}`,
    approve: (userId: string) => `/User/Approved/${userId}`,
    delete: (userId: string) => `/User/Delete/${userId}`,
  },
  /** IssueController, not ReportController: the service was renamed with the model. */
  report: {
    /** Multipart. Uploads the photo and runs the model in one call, so it is the slow one. */
    analyze: '/Issue/analyze',
    /** JSON, and it takes analyze's whole response back. Nothing exists server-side until this. */
    create: '/Issue/create',
    delete: (issueId: string) => `/Issue/${issueId}`,
  },
  map: {
    /** Both values are required: the server defaults them to 0 and then pages by zero. */
    all: (pageSize: number, page: number) =>
      `/Map/ShowIssueInMap?pageSize=${pageSize}&page=${page}`,
    byId: (issueId: string) => `/Map/SearchForIssueInMap?IssueId=${issueId}`,
    /** Unused: it answers 500 rather than [] when nothing matches, so the client filters. */
    byTitle: (title: string, pageSize: number, page: number) =>
      `/Map/SearchForIssueByTitleInMap?title=${encodeURIComponent(title)}&pageSize=${pageSize}&page=${page}`,
  },
  community: {
    comments: (issueId: string, page: number, pageSize: number) =>
      `/Community/GetCommentsByIssueId?issueId=${issueId}&page=${page}&pageSize=${pageSize}`,
  },
  storage: {
    /** No [Authorize], which is what lets an <Image> src point straight at it. */
    download: (objectName: string) =>
      `/storage?objectName=${encodeURIComponent(objectName)}`,
  },
} as const;
