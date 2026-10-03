import { currentNode } from './nodes';
import { CONFIDENCE_THRESHOLD, isClosedStatus } from './statuses';

import type { LifecycleFacts, LifecycleNode } from './nodes';
import type { Audience, LifecycleStatus } from './statuses';

/** What F-04's six-node timeline draws. The only answer to "where is this case" a screen may use. */
export type StepperView = {
  current: LifecycleNode;
  completed: readonly LifecycleNode[];
  /** §10.1: after a reopen nodes 4 and 5 are blank, which is not the same as incomplete. */
  cleared: readonly LifecycleNode[];
  isClosed: boolean;
};

const NODES_BEFORE: Record<LifecycleNode, readonly LifecycleNode[]> = {
  1: [],
  2: [1],
  3: [1, 2],
  4: [1, 2, 3],
  5: [1, 2, 3, 4],
  6: [1, 2, 3, 4, 5],
};

/** §10.1's farmer column. مغلقة إدارياً is folded into تم الحل here, as §3.2 requires. */
export function publicStepperNode(facts: LifecycleFacts): StepperView {
  const node = currentNode(facts);

  if (isClosedStatus(facts.status)) {
    return { current: 6, completed: [1, 2, 3, 4, 5, 6], cleared: [], isClosed: true };
  }

  if (facts.status === 'Reopened') {
    return { current: 3, completed: [1, 2], cleared: [4, 5], isClosed: false };
  }

  return { current: node, completed: NODES_BEFORE[node], cleared: [], isClosed: false };
}

export type ExpertAction = 'review' | 'continue' | 'view';

/** §8.3's stepper screens. Ids, not route names, so the model stays clear of navigation. */
export type ExpertScreen = 'E-02' | 'E-03' | 'E-04' | 'E-05' | 'E-06';

export type ExpertCta = {
  action: ExpertAction;
  screen: ExpertScreen;
  /** E-02 opens pre-filled after a reopen. */
  state?: 'reopened';
  /** §8.3: مجدولة cards lead with an outlined إعادة الجدولة before the primary. */
  secondaryAction?: 'reschedule';
};

/** §8.3's C-CTA. Takes facts, not status: قيد المراجعة and مجدولة each split across two nodes. */
export function expertCtaFor(facts: LifecycleFacts): ExpertCta {
  switch (facts.status) {
    case 'New':
      return { action: 'review', screen: 'E-02' };
    case 'Reopened':
      return { action: 'review', screen: 'E-02', state: 'reopened' };
    case 'UnderReview':
      return { action: 'continue', screen: facts.hasExpertReview ? 'E-03' : 'E-02' };
    case 'Scheduled':
      return {
        action: 'view',
        screen: facts.hasRepairConfirmation ? 'E-05' : 'E-04',
        secondaryAction: 'reschedule',
      };
    case 'Resolved':
    case 'AdminClosed':
      return { action: 'view', screen: 'E-06' };
  }
}

export type AiVisibilityInput = {
  audience: Audience;
  /** 0 to 1, as normalizeConfidence leaves it. */
  confidence: number;
  /** §10.2: once the expert has repainted severity the farmer sees it, whatever the model scored. */
  hasExpertReview: boolean;
  /** T2 hides the analysis on a transcription failure as well as below the threshold. */
  transcriptionFailed?: boolean;
  /** Passed in rather than read: the model stays pure, and both branches stay testable. */
  escalateLowConfidence: boolean;
};

/** T2 and §10.2. The farmer's only gate on AI output; no screen may decide this for itself. */
export function showsAiBlock(input: AiVisibilityInput): boolean {
  // §10.2: the expert always sees it, amber-chipped below the threshold. E-01 is the only place
  // a sub-threshold diagnosis is visible anywhere in the product.
  if (input.audience === 'expert') {
    return true;
  }

  if (!input.escalateLowConfidence) {
    return true;
  }

  // An expert review supersedes the model, so the farmer sees a reviewed case either way.
  if (input.hasExpertReview) {
    return true;
  }

  if (input.transcriptionFailed) {
    return false;
  }

  return input.confidence >= CONFIDENCE_THRESHOLD;
}

/** §10.7: others' reports only, undoable. §10.3 owns the undo half. */
export function canCorroborate(
  facts: LifecycleFacts,
  { isOwner }: { isOwner: boolean },
): boolean {
  // Callers must fail closed on an unknown identity: useIdentity's userId is undefined until
  // UserService answers, and ownership must never be guessed.
  if (isOwner) {
    return false;
  }

  // Assumed from §3.1's read-only-when-closed rule: a settled case takes no new corroboration.
  return !isClosedStatus(facts.status);
}

/** §3.1: the private thread goes read-only when the case closes, and T8 reopens it. */
export function isChatWritable(status: LifecycleStatus): boolean {
  return !isClosedStatus(status);
}

/** T7's composerHidden, on the public comment thread. */
// Deliberately not the inverse of isChatWritable: two surfaces, so either can change alone.
export function isComposerHidden(status: LifecycleStatus): boolean {
  return isClosedStatus(status);
}
