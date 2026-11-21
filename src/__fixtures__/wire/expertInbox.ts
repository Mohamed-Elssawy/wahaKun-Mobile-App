// GET /Expert/inbox. Typed unknown so a fixture can hold what the wire sends and the types refuse.

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
function inboxRow(
  id: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
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

/** What the client asks for, so `pageCount` below is computed the way the server computes it. */
const WIRE_PAGE_SIZE = 10;

// pageCount is ceil(resultsOnThisPage / PageSize), so it is unusable: paginate off totalCount.
function page(
  pageIndex: number,
  results: Record<string, unknown>[],
  totalCount: number,
): unknown {
  return {
    pageIndex,
    pageCount: Math.ceil(results.length / WIRE_PAGE_SIZE),
    totalCount,
    results,
  };
}

function rowsFrom(start: number, count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, index) => inboxRow(`issue-${start + index}`));
}

/** Ten rows is what the client asks for. The server's `[5, 10]` clamp is UNOBSERVED - I6. */
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
export const priorityAsFourPage: unknown = page(
  1,
  [inboxRow('issue-p4', { priority: '4' })],
  1,
);

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

// PROBE C12 verbatim: its status is Repaired, not Assigned, since the inbox has no status filter.
export const PROBE_ROW_ID = 'c1ab329a-b573-4a42-6485-08df2764951d';
export const PROBE_EXPERT_ID = '2f0e2ba8-bbd6-4116-ef5f-08df26746bb4';

export const probeInboxPage: unknown = page(
  1,
  [
    {
      id: PROBE_ROW_ID,
      title: 'انسداد في قناة الري',
      description: 'تم رصد عائق داخل قناة الري يمنع تدفق المياه.',
      status: 'Repaired',
      priority: 'Medium',
      createdAt: '2026-10-11T07:22:25.340866',
      assignedExpertId: PROBE_EXPERT_ID,
    },
  ],
  1,
);

/** I7, verbatim: `pageIndex=99` answers 200 with an empty page, not an exception - C9 confirmed. */
export const emptyPage: unknown = {
  pageIndex: 99,
  pageCount: 0,
  totalCount: 1,
  results: [],
};

/** A long-serving expert: the inbox has no server-side status filter, so nothing ever leaves it. */
export const CAPPED_TOTAL = 200;

export function cappedPage(pageIndex: number): unknown {
  return page(pageIndex, rowsFrom((pageIndex - 1) * 10 + 1, 10), CAPPED_TOTAL);
}
