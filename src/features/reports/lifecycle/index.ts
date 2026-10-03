/** Import the model from here, never from a file inside it, so the public surface is one place. */
// Nothing in here imports from another feature, from api/, from navigation/ or from React.
// Screens reach it through hooks; see ARCHITECTURE.md.

export {
  CONFIDENCE_THRESHOLD,
  fromWireStatus,
  isClosedStatus,
  isClosedWireStatus,
  LIFECYCLE_STATUSES,
  UNREPRESENTABLE_ON_THE_WIRE,
} from './statuses';
export type { Actor, Audience, LifecycleStatus } from './statuses';

export {
  currentNode,
  factsFromWireStatus,
  LIFECYCLE_NODES,
  STATUS_FOR_NODE,
} from './nodes';
export type { LifecycleFacts, LifecycleNode } from './nodes';

export { attempt, TRANSITIONS } from './transitions';
export type {
  Effect,
  LifecycleEvent,
  TransitionAttempt,
  TransitionId,
  TransitionResult,
} from './transitions';

export type { RefusalCode } from './refusals';

export { canWrite, requestWrite, writePermission } from './permissions';
export type { WritableField, WritePermission, WriteResult } from './permissions';

export {
  canCorroborate,
  expertCtaFor,
  isChatWritable,
  isComposerHidden,
  publicStepperNode,
  showsAiBlock,
} from './selectors';
export type {
  AiVisibilityInput,
  ExpertAction,
  ExpertCta,
  ExpertScreen,
  StepperView,
} from './selectors';

export {
  describeStatus,
  describeWireStatus,
  EXPERT_ACTION_LABELS,
  RESCHEDULE_LABEL,
  stageFor,
  UNTITLED_REPORT,
} from './display';
export type { StatusDisplay, StatusIconToken, StatusStage } from './display';

/** Re-exported so a screen has one import for both axes; `tier` is the droplet glyph. */
export { describeSeverity, isCriticalSeverity } from '../severity';
export type { SeverityDisplay, SeverityTier } from '../severity';
