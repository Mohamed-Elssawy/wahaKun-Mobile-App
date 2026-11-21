// GET /Farmer/issues/{reporterId}. latiude is the backend's spelling; status and priority are names.

export const REPORTER_ID = 'f86295b1-6d2e-4a6f-9d2a-0c1b3e5a7d91';

/** IssueStatus as the int it used to be. Kept: the deployment has reverted behaviour before. */
export const EVERY_STATUS_CODE = [0, 1, 2, 3, 4, 5, 6] as const;

/** The same seven in the vocabulary the deployment actually speaks, in code order. */
export const EVERY_STATUS_NAME = [
  'Reported',
  'Diagnosed',
  'Assigned',
  'Reviewed',
  'Scheduled',
  'Repaired',
  'completed',
] as const;

// The thirteen fields PROBE C2 returned; the three expert fields default to their G12 values.
export function farmerIssueRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    issueId: 'i-1',
    title: 'تسريب في الأنبوب',
    description: 'ماء على السطح',
    createdAt: '2026-10-05T19:47:30',
    status: 'Assigned',
    priority: 'Critical',
    longitude: '33',
    latiude: '21',
    reporterId: REPORTER_ID,
    expertName: null,
    expertUrl: null,
    expertId: '00000000-0000-0000-0000-000000000000',
    imageUrl: 'issues/360f5be4-c647-480b-ab7b-73fd76495993.jpg',
    ...overrides,
  };
}

// pageCount follows FarmerService's arithmetic: ceil(rows / PageSize) against a clamp floor of 5.
export function farmerIssuesPage(rows: unknown): unknown {
  const results = rows as unknown[];

  return {
    pageIndex: 1,
    pageCount: Math.ceil(results.length / 5),
    totalCount: results.length,
    results,
  };
}

/** One row per IssueStatus name, so a wrong entry in the table cannot hide. */
export const everyStatusName: unknown = EVERY_STATUS_NAME.map(status =>
  farmerIssueRow({ issueId: `i-${status}`, status }),
);

/** The same seven as integers. The mapper must read both vocabularies - R2/D4. */
export const everyStatusCode: unknown = EVERY_STATUS_CODE.map(status =>
  farmerIssueRow({ issueId: `i-${status}`, status }),
);

/** A value the server grew after this build. Falls back rather than throwing. */
export const unknownStatusCode: unknown = [
  farmerIssueRow({ issueId: 'i-grown', status: 7 }),
];

/** The same drift in the name vocabulary, which is the one the deployment speaks today. */
export const unknownStatusName: unknown = [
  farmerIssueRow({ issueId: 'i-grown-name', status: 'Escalated' }),
];

// PROBE C2 carries no appointment fields at all (G13), so the mapper meets a row without one.
export const noAppointmentFields: unknown = [farmerIssueRow()];

// G12 at its worst: the server sends no expert for an issue that really has one assigned.
export const expertAlwaysEmpty: unknown = [
  farmerIssueRow({
    issueId: 'i-has-expert-on-the-server',
    status: 'Assigned',
    expertName: null,
    expertUrl: null,
    expertId: '00000000-0000-0000-0000-000000000000',
  }),
];

// The two rows the default predicate hides, which is the whole reason the query is blanked.
export const hiddenByDefaultPredicate: unknown = [
  farmerIssueRow({
    issueId: 'c1ab329a-b573-4a42-6485-08df2764951d',
    title: 'انسداد في قناة الري',
    status: 'Repaired',
    priority: 'Medium',
    createdAt: '2026-10-11T07:22:25.340866',
    longitude: '31.63816739',
    latiude: '30.13256382',
    imageUrl: 'issues/7ea5a3ff-66b2-433a-af16-c9fad94c517a.jpg',
  }),
  farmerIssueRow({
    issueId: 'd91da092-34b5-4a22-428f-08df27ce0175',
    title: 'انسداد في قناة الري',
    status: 'Repaired',
    priority: 'Medium',
    createdAt: '2026-10-11T19:50:36.139341',
    longitude: '31.63824311',
    latiude: '30.1324686',
    imageUrl: 'issues/4ca048cc-b8fc-4cd1-b709-26607f2460ad.jpg',
  }),
];

/** A just-filed report, before the assignment job has run. F1 is the cast that trips over it. */
export const noExpert: unknown = [
  farmerIssueRow({
    issueId: 'i-unassigned',
    status: 'Reported',
    expertName: '',
    expertUrl: '',
    expertId: null,
  }),
];

/** A row with no photo at all, so the mapper must not invent an attachment. */
export const noPhoto: unknown = [
  farmerIssueRow({ issueId: 'i-no-photo', imageUrl: null }),
];

/** Two naive timestamps a day apart, for the sort that depends on reading them as UTC. */
export const twoRowsNaiveTimestamps: unknown = [
  farmerIssueRow({ issueId: 'server-old', createdAt: '2026-10-04T13:01:13.4206342' }),
  farmerIssueRow({ issueId: 'server-new', createdAt: '2026-10-05T12:45:58.0923551' }),
];
