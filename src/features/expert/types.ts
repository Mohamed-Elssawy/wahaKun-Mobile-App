import type { LifecycleFacts } from '@/features/reports/lifecycle';
import type { Severity } from '@/features/reports/types';
import type { PickedImage } from '@/types/image';

/**
 * §8.3's E-01 card. `LifecycleFacts` fields are spread in directly, not nested, so
 * `expertCtaFor`/`currentNode` take a case straight off the inbox with no adapter - the same
 * move `trackerFacts` makes for F-06.
 */
export type ExpertCaseSummary = LifecycleFacts & {
  reportId: string;
  title: string;
  /** Raw AI string, same as `Report.analysis.severity` - run through `describeSeverity`. */
  severity: Severity;
  /** 0 to 1, already normalized. */
  confidence: number;
  /** §10.2/§10.3: on every E-01 card, sortable - a triage signal here, not social proof. */
  corroborationCount: number;
  reporterName: string;
  reporterAvatar?: string;
  /** Relative-time basis for "⏱ منذ 8 ساعات". */
  createdAt: string;
  photoUrl?: string;
};

/** E-02's report card plus the AI diagnosis block. Adds nothing `expertCtaFor` needs. */
export type ExpertCaseDetail = ExpertCaseSummary & {
  explanation?: string;
  recommendation?: string;
  /** The farmer's own text, independent of the AI title. */
  description?: string;
  /**
   * `state:reopened` only. §8.3: E-02 pre-fills with the expert's own previous review, not the
   * AI's - the repair photo is what `C-REOPEN-CLEAN` hides, and that lives on the farmer tracker.
   */
  previousReview?: ExpertReviewOverride & { expertNote?: string };
  /** T4's just-submitted decision for *this* cycle - E-03's `قرار الخبير` card reads this.
   * Distinct from `previousReview`, which is about the cycle before the last reopen. */
  currentOverride?: ExpertReviewOverride;
  /** T5's payload. E-03 writes it; E-01's `مجدولة` cards and E-04/E-05/E-06 read it back. */
  appointment?: ExpertAppointment;
  /** T6's payload. E-04 writes it; E-05/E-06 read it back for `ملخص ما تم إرساله للمزارع`. */
  repair?: ExpertRepair;
};

/** §8.3's six fixed E-03 slots, identical every day - availability is never modelled. */
export const SCHEDULE_SLOTS = [
  '7:00 ص',
  '9:00 ص',
  '11:00 ص',
  '1:00 م',
  '3:00 م',
  '5:00 م',
] as const;

export type ScheduleSlot = (typeof SCHEDULE_SLOTS)[number];

export type ExpertAppointment = {
  /** YYYY-MM-DD in the device's local calendar, matching `scheduleWindow`'s own dates. */
  date: string;
  slot: ScheduleSlot;
  /** §8.3: opens the chat as message 1 once chat exists; persisted here until then. */
  noteToFarmer?: string;
};

export type ExpertRepair = {
  photoUrl: string;
  notes: string;
};

export type ConfirmAppointmentFields = {
  reportId: string;
  date: string;
  slot: ScheduleSlot;
  noteToFarmer?: string;
};

export type ConfirmRepairFields = {
  reportId: string;
  photo: PickedImage;
  notes: string;
};

/** `C-OVERRIDE` ON. Both fields are required together - there is no partial override. */
export type ExpertReviewOverride = {
  severity: Severity;
  correctedDiagnosis: string;
};

/** What E-02's primary button sends. No draft type exists anywhere - there are no drafts. */
export type SubmitExpertReviewFields = {
  reportId: string;
  /** Undefined when the toggle is OFF: the expert may proceed having changed nothing. */
  override?: ExpertReviewOverride;
  /** ملاحظات الخبير. Always optional, independent of the override. */
  expertNote?: string;
};

/** §8.3 draws exactly one ترتيب mode today; the type stays a union for when a second lands. */
export type ExpertSort = 'severity';

/** The four filter chips after ترتيب. Independent toggles, same shape as community's `FeedSeverity`. */
export type ExpertFilterChip = 'lowConfidence' | 'critical' | 'medium' | 'low';

export type ExpertApi = {
  /** Scoped server-side to this expert; nothing here re-filters by assignment. */
  getAssignedCases: () => Promise<ExpertCaseSummary[]>;
  getCaseDetail: (reportId: string) => Promise<ExpertCaseDetail>;
  /** T-review. Marks `hasExpertReview`, and when `override` is set, repaints severity silently. */
  submitReview: (fields: SubmitExpertReviewFields) => Promise<void>;
  /** T5. */
  confirmAppointment: (fields: ConfirmAppointmentFields) => Promise<void>;
  /** T6. */
  confirmRepair: (fields: ConfirmRepairFields) => Promise<void>;
};

/**
 * §8.3's E-09 row. Minimal on purpose: E-10's message list, a composer and read-receipts are
 * a separate unit. `reportId` is here so a later row can open the case screen a thread belongs
 * to, the same way E-10 will open the chat itself.
 */
export type ChatThread = {
  id: string;
  reportId: string;
  farmerName: string;
  farmerAvatar?: string;
  lastMessage: {
    kind: 'text' | 'voice' | 'image';
    /** Only `text` carries one; voice/image render their own fixed preview copy. */
    text?: string;
    fromExpert: boolean;
  };
  lastMessageAt: string;
  isUnread: boolean;
  /** False once the case has closed or Admin has reassigned it away - the نشطة فقط filter's axis. */
  isActive: boolean;
};

export type ChatApi = {
  getThreads: () => Promise<ChatThread[]>;
};
