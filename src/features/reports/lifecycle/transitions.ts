import { currentNode } from './nodes';
import { isClosedStatus } from './statuses';

import type { LifecycleFacts, LifecycleNode } from './nodes';
import type { RefusalCode } from './refusals';
import type { Actor, LifecycleStatus } from './statuses';

/** §3.5's rows. T9 is absent on purpose: it was removed, and §3.6 records why. */
export type TransitionId =
  | 'T1'
  | 'T2'
  | 'T3'
  | 'T4'
  | 'T5'
  | 'T6'
  | 'T7'
  | 'T8'
  | 'T10'
  | 'T11'
  | 'T12'
  | 'T13'
  | 'T14'
  | 'T15';

/** §3.5's Event column, plus the four §3.6 names that exist only to be refused. */
export type LifecycleEvent =
  | 'submit'
  | 'aiDiagnosisReturned'
  | 'autoRoute'
  | 'submitReview'
  | 'confirmAppointment'
  | 'confirmRepair'
  | 'farmerConfirms'
  | 'farmerRejects'
  | 'reschedule'
  | 'adminForceClose'
  | 'evidenceUnreadable'
  | 'discardUnreadable'
  | 'adminReassign'
  | 'declineCase'
  | 'handBack'
  | 'returnToNew'
  | 'timeout';

/** §3.5's Side effects column, one code per clause, so the table is asserted rather than read. */
export type Effect =
  | 'recordCreated'
  | 'locationCaptured'
  | 'publishedToFeed'
  | 'aiFieldsWritten'
  | 'analysisHiddenFromFarmer'
  | 'expertNotified'
  | 'farmerNotified'
  | 'expertChipShown'
  | 'publicCommentPosted'
  | 'severityRepainted'
  | 'appointmentChipShown'
  | 'chatOpened'
  | 'repairPublished'
  | 'farmerAskedToConfirm'
  | 'chatReadOnly'
  | 'composerHidden'
  | 'severityBadgeDropped'
  | 'nodesFourAndFiveCleared'
  | 'repairPhotoHiddenFromExpert'
  | 'chatReopened'
  | 'changeReasonRequired'
  | 'nodeFourChipReplaced'
  | 'rendersAsResolvedToFarmer'
  | 'adminClosurePayload'
  | 'recordPersistedUntitled'
  | 'recordDiscarded'
  | 'expertChipChanged'
  | 'chatClosedAndRestarted';

export type TransitionResult =
  | {
      ok: true;
      id: TransitionId;
      /** Null for T13 and T14, the two rows of §3.5 that move no status. */
      to: LifecycleStatus | null;
      node: LifecycleNode | 'closed' | null;
      effects: readonly Effect[];
    }
  | { ok: false; refusal: RefusalCode };

export type TransitionAttempt = {
  event: LifecycleEvent;
  actor: Actor;
  /** Null before T1, the only row with no record to move. */
  facts: LifecycleFacts | null;
};

type TransitionRule = {
  id: TransitionId;
  event: LifecycleEvent;
  actor: Actor;
  /** Null where §3.5's From column reads an em dash. */
  from: readonly LifecycleStatus[] | null;
  to: LifecycleStatus | null;
  node: LifecycleNode | 'closed' | null;
  effects: readonly Effect[];
  /** Where the row needs a condition status alone cannot express. */
  guard?: (facts: LifecycleFacts) => boolean;
};

/** §3.4's four open states. Both Admin rows read "any open". */
const OPEN: readonly LifecycleStatus[] = ['New', 'UnderReview', 'Scheduled', 'Reopened'];

/** §3.5, verbatim. Exported because T12 and T15 describe arrivals the app renders but never sends. */
export const TRANSITIONS: readonly TransitionRule[] = [
  {
    id: 'T1',
    event: 'submit',
    actor: 'farmer',
    from: null,
    to: 'New',
    node: 1,
    effects: ['recordCreated', 'locationCaptured', 'publishedToFeed'],
  },
  {
    id: 'T2',
    event: 'aiDiagnosisReturned',
    actor: 'system',
    from: ['New'],
    to: 'New',
    node: 2,
    effects: ['aiFieldsWritten', 'analysisHiddenFromFarmer'],
    guard: facts => !facts.hasAiAnalysis,
  },
  {
    id: 'T3',
    event: 'autoRoute',
    actor: 'system',
    from: ['New'],
    to: 'UnderReview',
    node: 3,
    effects: ['expertNotified', 'expertChipShown'],
  },
  {
    id: 'T4',
    event: 'submitReview',
    actor: 'expert',
    from: ['UnderReview'],
    to: 'UnderReview',
    node: 4,
    effects: ['publicCommentPosted', 'severityRepainted'],
    guard: facts => !facts.hasExpertReview,
  },
  {
    id: 'T5',
    event: 'confirmAppointment',
    actor: 'expert',
    from: ['UnderReview'],
    to: 'Scheduled',
    node: 5,
    effects: ['farmerNotified', 'appointmentChipShown', 'chatOpened'],
    // §8.3 puts الجدولة after مراجعة, and C-CTA sends an unfinished review back to E-02.
    guard: facts => facts.hasExpertReview,
  },
  {
    id: 'T6',
    event: 'confirmRepair',
    actor: 'expert',
    from: ['Scheduled'],
    to: 'Scheduled',
    node: 6,
    effects: ['repairPublished', 'farmerNotified', 'farmerAskedToConfirm'],
    guard: facts => !facts.hasRepairConfirmation,
  },
  {
    id: 'T7',
    event: 'farmerConfirms',
    actor: 'farmer',
    from: ['Scheduled'],
    to: 'Resolved',
    node: 'closed',
    effects: ['chatReadOnly', 'composerHidden', 'severityBadgeDropped'],
    // §10.1 puts the tick and cross at node 6 only, so there is nothing to confirm before T6.
    guard: facts => facts.hasRepairConfirmation,
  },
  {
    id: 'T8',
    event: 'farmerRejects',
    actor: 'farmer',
    from: ['Scheduled'],
    to: 'Reopened',
    node: 3,
    effects: [
      'nodesFourAndFiveCleared',
      'repairPhotoHiddenFromExpert',
      'chatReopened',
      'expertNotified',
    ],
    guard: facts => facts.hasRepairConfirmation,
  },
  {
    id: 'T10',
    event: 'reschedule',
    actor: 'expert',
    from: ['Reopened'],
    to: 'Scheduled',
    node: 5,
    effects: ['changeReasonRequired', 'nodeFourChipReplaced', 'farmerNotified'],
  },
  {
    id: 'T11',
    event: 'reschedule',
    actor: 'expert',
    from: ['Scheduled'],
    to: 'Scheduled',
    node: 5,
    effects: ['changeReasonRequired', 'nodeFourChipReplaced', 'farmerNotified'],
  },
  {
    id: 'T12',
    event: 'adminForceClose',
    actor: 'admin',
    from: OPEN,
    to: 'AdminClosed',
    node: 'closed',
    effects: ['rendersAsResolvedToFarmer', 'adminClosurePayload'],
  },
  {
    id: 'T13',
    event: 'evidenceUnreadable',
    actor: 'system',
    from: null,
    to: null,
    node: null,
    effects: ['recordPersistedUntitled'],
  },
  {
    id: 'T14',
    event: 'discardUnreadable',
    actor: 'farmer',
    from: null,
    to: null,
    node: null,
    effects: ['recordDiscarded'],
  },
  {
    id: 'T15',
    event: 'adminReassign',
    actor: 'admin',
    from: OPEN,
    to: null,
    node: null,
    effects: ['farmerNotified', 'expertChipChanged', 'chatClosedAndRestarted'],
  },
];

/** §3.6's named clauses, checked before the table so the specific code wins over R-WRONG-*. */
function namedRefusal({ event, actor, facts }: TransitionAttempt): RefusalCode | null {
  if (event === 'timeout') {
    return 'R-NO-TIMEOUT';
  }

  if (event === 'declineCase' || event === 'handBack' || event === 'returnToNew') {
    return 'R-EXPERT-CANNOT-HAND-BACK';
  }

  if (event === 'adminForceClose') {
    return 'R-NO-MOBILE-ADMIN-CLOSE';
  }

  if (event === 'adminReassign') {
    return 'R-NO-MOBILE-ADMIN-REASSIGN';
  }

  if (facts && isClosedStatus(facts.status)) {
    return 'S-TERMINAL';
  }

  if (event === 'farmerConfirms' && actor === 'expert') {
    return 'R-EXPERT-CANNOT-CLOSE';
  }

  return null;
}

/** The one way to move a case. Returns a result rather than throwing, so a screen can branch on it. */
export function attempt(input: TransitionAttempt): TransitionResult {
  const refusal = namedRefusal(input);
  if (refusal) {
    return { ok: false, refusal };
  }

  const candidates = TRANSITIONS.filter(rule => rule.event === input.event);
  if (candidates.length === 0) {
    return { ok: false, refusal: 'R-WRONG-STATUS' };
  }

  // Actor first: §3.5 gives every row exactly one, and a wrong actor is the more specific answer.
  const forActor = candidates.filter(rule => rule.actor === input.actor);
  if (forActor.length === 0) {
    return { ok: false, refusal: 'R-WRONG-ACTOR' };
  }

  const rule = forActor.find(candidate => {
    if (candidate.from === null) {
      return input.facts === null;
    }
    if (!input.facts || !candidate.from.includes(input.facts.status)) {
      return false;
    }
    return candidate.guard ? candidate.guard(input.facts) : true;
  });

  if (!rule) {
    return { ok: false, refusal: 'R-WRONG-STATUS' };
  }

  return {
    ok: true,
    id: rule.id,
    // T15 leaves the status alone, so the row's null means "whatever it already was".
    to: rule.id === 'T15' && input.facts ? input.facts.status : rule.to,
    node: rule.id === 'T15' && input.facts ? currentNode(input.facts) : rule.node,
    effects: rule.effects,
  };
}
