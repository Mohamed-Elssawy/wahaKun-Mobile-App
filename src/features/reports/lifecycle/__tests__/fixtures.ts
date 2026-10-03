import type { LifecycleFacts } from '../nodes';

const AT_NODE_1: LifecycleFacts = {
  status: 'New',
  hasAiAnalysis: false,
  hasExpertReview: false,
  hasAppointment: false,
  hasRepairConfirmation: false,
};

/** Defaults to node 1, so each fixture below names only what its own node adds. */
export function facts(overrides: Partial<LifecycleFacts> = {}): LifecycleFacts {
  return { ...AT_NODE_1, ...overrides };
}

export const atNode1 = facts();
export const atNode2 = facts({ hasAiAnalysis: true });
export const atNode3 = facts({ status: 'UnderReview', hasAiAnalysis: true });

export const atNode4 = facts({
  status: 'UnderReview',
  hasAiAnalysis: true,
  hasExpertReview: true,
});

export const atNode5 = facts({
  status: 'Scheduled',
  hasAiAnalysis: true,
  hasExpertReview: true,
  hasAppointment: true,
});

export const atNode6 = facts({ ...atNode5, hasRepairConfirmation: true });

export const resolved = facts({ ...atNode6, status: 'Resolved' });
export const adminClosed = facts({ ...atNode5, status: 'AdminClosed' });

/** T8 clears nodes 4 and 5, so the review, the appointment and the repair are all gone. */
export const reopened = facts({ status: 'Reopened', hasAiAnalysis: true });

/** The six nodes in order, for the loops that have to cover every one of them. */
export const EVERY_NODE: readonly LifecycleFacts[] = [
  atNode1,
  atNode2,
  atNode3,
  atNode4,
  atNode5,
  atNode6,
];
