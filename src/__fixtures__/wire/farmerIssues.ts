// GET /Farmer/issues/{reporterId} - GetFarmerIssues[], BACKEND-INTEGRATION-FACTS.md §4.3.
// `status` is an INT, `sceduleDate` is misspelled on the wire, and both are kept verbatim - F35.

export const REPORTER_ID = 'f86295b1-6d2e-4a6f-9d2a-0c1b3e5a7d91';

/** IssueStatus as the int it is: no JsonStringEnumConverter is registered anywhere - §2. */
export const EVERY_STATUS_CODE = [0, 1, 2, 3, 4, 5, 6] as const;

export function farmerIssueRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    issueId: 'i-1',
    title: 'تسريب في الأنبوب',
    description: 'ماء على السطح',
    createdAt: '2026-10-05T19:47:30',
    status: 2,
    slotStart: '09:00:00',
    slotEnd: '11:00:00',
    sceduleDate: '2026-10-09T00:00:00',
    reporterId: REPORTER_ID,
    expertName: 'سيد حسن',
    expertUrl: 'profile-pictures/sayed.jpg',
    expertId: 'e-1',
    teamName: null,
    ...overrides,
  };
}

/** One row per IssueStatus value, so a wrong entry in the table cannot hide. */
export const everyStatusCode: unknown = EVERY_STATUS_CODE.map(status =>
  farmerIssueRow({ issueId: `i-${status}`, status }),
);

/** A value the server grew after this build. Falls back rather than throwing. */
export const unknownStatusCode: unknown = [farmerIssueRow({ issueId: 'i-grown', status: 7 })];

/** The scheduling fields the row really carries, all of which the mapper drops today. */
export const withAppointment: unknown = [farmerIssueRow()];

/** What the farmer actually gets: GetFarmerIssuesSpecs never includes RepairSchedule - F6. */
export const appointmentAlwaysNull: unknown = [
  farmerIssueRow({ slotStart: null, slotEnd: null, sceduleDate: null }),
];

/** A just-filed report, before ExpertAssignmentJob has run - and F1 is why this shape matters. */
export const noExpert: unknown = [
  farmerIssueRow({
    issueId: 'i-unassigned',
    status: 0,
    expertName: '',
    expertUrl: '',
    expertId: null,
    slotStart: null,
    slotEnd: null,
    sceduleDate: null,
  }),
];

/** Two naive timestamps a day apart, for the sort that depends on reading them as UTC. */
export const twoRowsNaiveTimestamps: unknown = [
  farmerIssueRow({ issueId: 'server-old', createdAt: '2026-10-04T13:01:13.4206342' }),
  farmerIssueRow({ issueId: 'server-new', createdAt: '2026-10-05T12:45:58.0923551' }),
];
