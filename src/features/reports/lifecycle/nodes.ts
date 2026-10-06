import { fromWireStatus, isClosedStatus } from './statuses';

import type { ReportStatus } from '../types';
import type { LifecycleStatus } from './statuses';

/** §3.3's six nodes. The farmer's الخطوة N من ٦ and the expert's 4-node stepper both view these. */
export type LifecycleNode = 1 | 2 | 3 | 4 | 5 | 6;

export const LIFECYCLE_NODES: readonly LifecycleNode[] = [1, 2, 3, 4, 5, 6];

/** §3.3. One direction only: three statuses each span two nodes, so the reverse is not a function. */
export const STATUS_FOR_NODE: Record<LifecycleNode, LifecycleStatus> = {
  1: 'New',
  2: 'New',
  3: 'UnderReview',
  4: 'UnderReview',
  5: 'Scheduled',
  6: 'Scheduled',
};

/** What placing a case needs beyond its status. Every field is something a screen already holds. */
export type LifecycleFacts = {
  status: LifecycleStatus;
  /** T2 has returned, which is the whole of the difference between node 1 and node 2. */
  hasAiAnalysis: boolean;
  /** T4 has been submitted. No IssueStatus value carries this, so nothing can infer it. */
  hasExpertReview: boolean;
  /** T5 confirmed an appointment. False on a reopen, because T8 clears node 4. */
  hasAppointment: boolean;
  /** T6 published a repair, which is what moves node 5 to node 6. */
  hasRepairConfirmation: boolean;
};

/** §3.3 read backwards. Reopened sits at node 3 because T8 clears nodes 4 and 5. */
export function currentNode(facts: LifecycleFacts): LifecycleNode {
  switch (facts.status) {
    case 'New':
      return facts.hasAiAnalysis ? 2 : 1;
    case 'UnderReview':
      return facts.hasExpertReview ? 4 : 3;
    case 'Reopened':
      return 3;
    case 'Scheduled':
      return facts.hasRepairConfirmation ? 6 : 5;
    case 'Resolved':
    case 'AdminClosed':
      return 6;
  }
}

/** The facts a bare wire status can support, for a list row that has no detail payload yet. */
// Reviewed is the only wire value hasExpertReview can read off: it is what separates node 3
// (Assigned) from node 4 (Reviewed), since both land on the UnderReview lifecycle status.
export function factsFromWireStatus(status: ReportStatus): LifecycleFacts {
  const lifecycle = fromWireStatus(status);
  const isClosed = isClosedStatus(lifecycle);

  return {
    status: lifecycle,
    hasAiAnalysis: status !== 'Reported',
    hasExpertReview: status === 'Reviewed',
    hasAppointment: lifecycle === 'Scheduled' || isClosed,
    hasRepairConfirmation: status === 'Repaired' || isClosed,
  };
}
