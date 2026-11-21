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
    /** Multipart. Enqueues issue creation; Low or Unknown priority creates nothing. */
    analyze: '/Issue/analyze',
  },
  /** IssueService on PORTS.issue (5195), not ReportService: expert and farmer issue routes. */
  issue: {
    /** pageIndex is lowercase and 1-based. An empty page is a clean 200, not an exception. */
    inbox: (pageSize: number, pageIndex: number, sortingOptions: number) =>
      `/Expert/inbox?PageSize=${pageSize}&pageIndex=${pageIndex}&SortingOptions=${sortingOptions}`,
    /** A non-assigned caller and a missing row both answer a bare empty 500; the wrong role gets 403. */
    review: (issueId: string) => `/Expert/${issueId}/review`,
    submitReview: (issueId: string) => `/Expert/${issueId}/review`,
    schedule: (issueId: string) => `/Expert/${issueId}/schedule`,
    /** Multipart; refuses unless the issue's status is exactly Scheduled. */
    resolution: (issueId: string) => `/Expert/${issueId}/resolution`,
    /** Blank values null the filter and return every row; Assigend is the only spelling that binds. */
    farmerIssues: (reporterId: string) =>
      `/Farmer/issues/${reporterId}?Completed=&Critical=&Assigend=`,
    /** The id is sent twice on purpose: only that shape has ever been observed working. */
    tracking: (issueId: string) => `/Farmer/${issueId}/tracking?issueId=${issueId}`,
    /** Farmer accepts the repair: Repaired to completed. Any other status answers a bare 500. */
    complete: (issueId: string) => `/Farmer/${issueId}/complete`,
    /** Farmer rejects the repair: Repaired to Scheduled, and the Repaired rows are deleted. */
    uncomplete: (issueId: string) => `/Farmer/${issueId}/uncomplete`,
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
  /** Capital S: the ingress matches path prefixes case-sensitively, so lowercase never routes. */
  storage: {
    /** No [Authorize], which is what lets an <Image> src point straight at it. */
    download: (objectName: string) =>
      `/Storage?objectName=${encodeURIComponent(objectName)}`,
    /** Multipart under the field name `file`; the folder is a query param, not a part. */
    upload: (folder: string) => `/Storage/upload?folder=${encodeURIComponent(folder)}`,
  },
} as const;
