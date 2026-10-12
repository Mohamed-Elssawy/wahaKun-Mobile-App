// GET /Expert/inbox - PaginatedResult<ExpertInboxResponse>, BACKEND-INTEGRATION-FACTS.md §4.2.
// Typed `unknown` and cast at the boundary, so a fixture can hold what the wire really sends
// and the types refuse - `priority: "4"` from the §6 G11 enum mismatch, for one.

/** AssignedExpertId == me is the inbox's only filter, so every row carries the same guid. */
export const EXPERT_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

/** IssueStatus.ToString() in §3's declaration order. `completed` is lowercase in the C# source. */
export const EVERY_WIRE_STATUS = [
  'Reported',
  'Diagnosed',
  'Assigned',
  'Reviewed',
  'Scheduled',
  'Repaired',
  'completed',
] as const;

/** `createdAt` carries no offset: `datetime2` through System.Text.Json - §2, F34. */
function inboxRow(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    title: 'تسريب في الأنبوب',
    description: 'ماء على السطح',
    status: 'Assigned',
    priority: 'High',
    createdAt: '2026-10-05T19:47:30',
    assignedExpertId: EXPERT_ID,
    ...overrides,
  };
}

/** `pageCount` is the item count on this page, not the number of pages - §4.2 note 3, F33. */
function page(
  pageIndex: number,
  results: Record<string, unknown>[],
  totalCount: number,
): unknown {
  return { pageIndex, pageCount: results.length, totalCount, results };
}

function rowsFrom(start: number, count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, index) => inboxRow(`issue-${start + index}`));
}

/** PageSize is clamped server-side to [5, 10], so ten rows is the most one page can carry. */
export const fullPage: unknown = page(1, rowsFrom(1, 10), 10);

export const shortPage: unknown = page(1, rowsFrom(1, 3), 3);

/** totalCount larger than one page - 10 + 10 + 3 - which is what makes the client page at all. */
export const pagedTotal: readonly unknown[] = [
  page(1, rowsFrom(1, 10), 23),
  page(2, rowsFrom(11, 10), 23),
  page(3, rowsFrom(21, 3), 23),
];

/** One row per IssueStatus, for the sweep that has to see all seven in one load. */
export const everyStatusPage: unknown = page(
  1,
  EVERY_WIRE_STATUS.map((status, index) =>
    inboxRow(`issue-${status}`, { status, createdAt: `2026-10-05T1${index}:47:30` }),
  ),
  EVERY_WIRE_STATUS.length,
);

/** One status at a time, so each wire value gets a test of its own. */
export function statusPage(status: string): unknown {
  return page(1, [inboxRow(`issue-${status}`, { status })], 1);
}

/** §6 G11/F7: the two IssuePriority enums disagree, so a ReportService int reaches a string field. */
export const priorityAsFourPage: unknown = page(1, [inboxRow('issue-p4', { priority: '4' })], 1);

/** Nullable on the DTO. `description` is E-01's card subtitle and may simply be absent. */
export const nullFieldsPage: unknown = page(
  1,
  [inboxRow('issue-null', { description: null, assignedExpertId: null })],
  1,
);

/** Eight hours before RELATIVE_NOW once read as UTC, and a day and a half before it if not. */
export const naiveCreatedAtPage: unknown = page(
  1,
  [inboxRow('issue-naive', { createdAt: '2026-10-05T19:47:30' })],
  1,
);

export const RELATIVE_NOW = new Date('2026-10-06T03:47:30Z');

/** A long-serving expert: the inbox has no server-side status filter, so nothing ever leaves it. */
export const CAPPED_TOTAL = 200;

export function cappedPage(pageIndex: number): unknown {
  return page(pageIndex, rowsFrom((pageIndex - 1) * 10 + 1, 10), CAPPED_TOTAL);
}
