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
  /** IssueController, not ReportController: the service was renamed with the model. */
  report: {
    /** Multipart. Uploads the photo, runs the model and enqueues issue creation as a
     * background job; no issue is created when the mapped priority is Low or Unknown. */
    analyze: '/Issue/analyze',
  },
  /** IssueService on PORTS.issue (5195), not ReportService: expert and farmer issue routes. */
  issue: {
    /** `pageIndex` is lowercase and PageSize is clamped server-side to [5, 10]. */
    inbox: (pageSize: number, pageIndex: number, sortingOptions: number) =>
      `/Expert/inbox?PageSize=${pageSize}&pageIndex=${pageIndex}&SortingOptions=${sortingOptions}`,
    /** An empty inbox throws KeyNotFoundException rather than returning an empty page. */
    review: (issueId: string) => `/Expert/${issueId}/review`,
    submitReview: (issueId: string) => `/Expert/${issueId}/review`,
    schedule: (issueId: string) => `/Expert/${issueId}/schedule`,
    /** Multipart; refuses unless the issue's status is exactly Scheduled. */
    resolution: (issueId: string) => `/Expert/${issueId}/resolution`,
    /** ReporterId must be sent in the query string too - the route segment is read but unused. */
    farmerIssues: (reporterId: string) => `/Farmer/issues/${reporterId}?ReporterId=${reporterId}`,
    /** DO NOT WIRE: the service ANDs three contradictory filters and always throws 404/500. */
    communityFeed: '/Farmer/issues',
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
    /** Multipart under the field name `file`; the folder is a query param, not a part. */
    upload: (folder: string) => `/storage/upload?folder=${encodeURIComponent(folder)}`,
  },
} as const;
