'use strict';

// Paths copied verbatim from src/api/endpoints.ts, so the probe cannot share a wrong constant.

/** Mirrors PORTS in src/config/env.ts. Unused in gateway mode; recorded for the document. */
const PORTS = {
  auth: 5090,
  user: 5256,
  notification: 5140,
  report: 5173,
  media: 5230,
  community: 5087,
  map: 5249,
  issue: 5195,
};

const PATHS = {
  loginWithEmail: '/Auth/LoginWithEmail',
  firebaseLogin: '/Auth/firebase-login',
  login: '/Auth/Login',
  refreshToken: '/Auth/Refresh-Token',
  userDetails: '/User/details',
  analyze: '/Issue/analyze',
  farmerIssues: reporterId => `/Farmer/issues/${reporterId}`,
  communityFeed: '/Farmer/issues',
  tracking: issueId => `/Farmer/${issueId}/tracking`,
  complete: issueId => `/Farmer/${issueId}/complete`,
  uncomplete: issueId => `/Farmer/${issueId}/uncomplete`,
  inbox: (pageSize, pageIndex, sortingOptions) =>
    `/Expert/inbox?PageSize=${pageSize}&pageIndex=${pageIndex}&SortingOptions=${sortingOptions}`,
  review: issueId => `/Expert/${issueId}/review`,
  schedule: issueId => `/Expert/${issueId}/schedule`,
  resolution: issueId => `/Expert/${issueId}/resolution`,
  mapAll: (pageSize, page) => `/Map/ShowIssueInMap?pageSize=${pageSize}&page=${page}`,
  mapById: issueId => `/Map/SearchForIssueInMap?IssueId=${issueId}`,
  comments: (issueId, page, pageSize) =>
    `/Community/GetCommentsByIssueId?issueId=${issueId}&page=${page}&pageSize=${pageSize}`,
  storage: objectName => `/storage?objectName=${encodeURIComponent(objectName)}`,
};

/** The order the document groups rows in, independent of execution order. */
const SERVICE_GROUPS = [
  ['transport', 'Transport — the ngrok tunnel itself'],
  ['auth', 'AuthService — 5090'],
  ['user', 'UserService — 5256'],
  ['report', 'ReportService — 5173'],
  ['issue-farmer', 'IssueService — FarmerController — 5195'],
  ['issue-expert', 'IssueService — ExpertController — 5195'],
  ['map', 'MapService — 5249'],
  ['community', 'CommunityService — 5087'],
  ['media', 'MediaStorageService — 5230'],
];

// Read from backend source, not called, so the document stays complete without faking an observation.
const SOURCE_READ_ROWS = [
  {
    id: 'A6',
    group: 'auth',
    endpoint: '{BASE}/api/Auth/Login',
    method: 'POST',
    auth: 'none',
    status: 'NOT CALLED',
    sourceRead: true,
    body:
      'Request binds LoginRequest { string PhoneNumber } - no password. ' +
      'AuthService.cs:109 LoginAsync looks the user up by phone, then returns ' +
      'otpService.SendOtpAsync(phone) => OTPResponse(bool success, string message). ' +
      'No token is issued. POST /Auth/Verify-OTP is commented out in AuthController.',
    matches: 'n/a - not called',
    unblocks:
      'Nothing. The app does not use this route: src/api/endpoints.ts declares eight auth ' +
      'routes and neither /Auth/Login nor /Auth/Verify-OTP is among them. The phone path is ' +
      'Firebase - the native SDK sends and verifies the OTP, then POST /Auth/firebase-login ' +
      'exchanges the Firebase ID token for app tokens. Not called here so the probe fires no ' +
      'SMS, writes no OTP row and publishes no SendOtpEvent.',
  },
];

/** Written into every note field the probe sends, so a human reading the database knows why. */
const WRITE_MARKER =
  'WAHA KUN P2 server probe 2026-10-13 - automated contract probe, no action required';

module.exports = { PORTS, PATHS, SERVICE_GROUPS, SOURCE_READ_ROWS, WRITE_MARKER };
