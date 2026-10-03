// English keys, because §12.2 can repaint the Arabic and a key that is copy would force a type
// change on a copy tweak. display.ts owns the feminine labels.

import type { ReportStatus } from '../types';

/** The five farmer-visible statuses of §3.2, plus the one only an Admin can produce. */
export type LifecycleStatus =
  'New' | 'UnderReview' | 'Scheduled' | 'Resolved' | 'Reopened' | 'AdminClosed';

/** Declaration order is §3.2's, so a table-driven test reads in spec order. */
export const LIFECYCLE_STATUSES: readonly LifecycleStatus[] = [
  'New',
  'UnderReview',
  'Scheduled',
  'Resolved',
  'Reopened',
  'AdminClosed',
];

/** §10.7's four columns. The model asks who is acting, never who is reading. */
export type Actor = 'farmer' | 'expert' | 'system' | 'admin';

/** Which side of §10.2's asymmetries a reader sits on. */
export type Audience = 'farmer' | 'expert';

/** §8.3 lists the threshold among the things an expert cannot change, so it is not a flag. */
export const CONFIDENCE_THRESHOLD = 0.8;

/** §3.6 makes تم الحل terminal, and §3.4 gives مغلقة إدارياً the same exit. */
export function isClosedStatus(status: LifecycleStatus): boolean {
  return status === 'Resolved' || status === 'AdminClosed';
}

/** ReportService's IssueStatus onto §3.2. */
// Repaired is node 6 and still مجدولة: T6 leaves the status alone, and only T7's ✓ closes a case.
const WIRE_STATUSES: Record<ReportStatus, LifecycleStatus> = {
  Reported: 'New',
  Diagnosed: 'New',
  // Verified has no §3.2 home, and nothing in §3.5 verifies before routing, so it stays جديدة.
  Verified: 'New',
  Assigned: 'UnderReview',
  Scheduled: 'Scheduled',
  Repaired: 'Scheduled',
  Completed: 'Resolved',
};

/** Falls back rather than throwing: the server can grow IssueStatus before this file does. */
export function fromWireStatus(status: ReportStatus): LifecycleStatus {
  return WIRE_STATUSES[status] ?? 'New';
}

/** The two §3.2 statuses IssueStatus cannot express, so nothing reads them off the wire. */
// Both are filed in BACKEND-CONTRACT-REQUESTS.md; a reopen has no enum value to arrive as.
export const UNREPRESENTABLE_ON_THE_WIRE: readonly LifecycleStatus[] = [
  'Reopened',
  'AdminClosed',
];
