import type { LifecycleFacts } from '@/features/reports/lifecycle';
import type { WirePriority } from '@/features/reports/severity';
import type { ReportStatus, Severity } from '@/features/reports/types';
import type { PickedImage } from '@/types/image';

/** E-01's card. LifecycleFacts is spread in, so expertCtaFor needs no adapter. */
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
  /** Optional like its siblings: a case whose detail call failed carries none. */
  repairSteps?: string[];
  /** The farmer's own text, independent of the AI title. */
  description?: string;
  /** state:reopened only: E-02 pre-fills with the expert's own previous review, not the AI's. */
  previousReview?: ExpertReviewOverride & { expertNote?: string };
  /** This cycle's decision, distinct from previousReview, which is the cycle before the reopen. */
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

/** §8.3's E-03 reschedule-only chips. `أخرى` alone takes the free-text note. */
export const RESCHEDULE_REASON_CHIPS = [
  'ظروف الطقس',
  'طارئ في حالة أخرى',
  'بطلب من المزارع',
  'أخرى',
] as const;

export type RescheduleReasonChip = (typeof RESCHEDULE_REASON_CHIPS)[number];

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
  /** state:reschedule only, since the farmer's node-4 chip renders it. The mock stores it. */
  reason?: string;
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

/** E-09's row. Minimal on purpose: E-10's message list and composer are a separate unit. */
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

/** ExpertController's wire shapes, camelCase, with enums arriving by name. */

/** IssuePriority.ToString(), declared in features/reports and re-exported here. */
export type { WirePriority };

/** PaginatedResult<T>. pageCount is ceil(resultsOnThisPage / PageSize); nothing reads it. */
export type ExpertPaginatedWire<T> = {
  pageIndex: number;
  pageCount: number;
  totalCount: number;
  results: T[];
};

/** ExpertInboxResponse. No confidence, no reporter, no photo - see BACKEND-GAPS G5/G6/G7. */
export type ExpertInboxRowWire = {
  id: string;
  title: string;
  description?: string | null;
  status: ReportStatus;
  priority: WirePriority;
  createdAt: string;
  assignedExpertId?: string | null;
};

/** IssueAttachmentType. By name now, with the integer kept for a build without the converter. */
export type IssueAttachmentWire = {
  id: string;
  type: 0 | 1 | 'Photo' | 'Voice';
  url: string;
};

/** AiAnalysisResponse. `severity` is typed as the union so the server's raw Arabic lands in it. */
export type ExpertAiAnalysisWire = {
  problemName: string;
  problemArabic?: string | null;
  confidence: number;
  severity: Severity;
  recommendation: string;
  explanation?: string | null;
  repairSteps: string[];
};

/** ReviewDecision, by name in a response for the same reason: 0 = ConfirmAi, 1 = Override. */
export type ExpertReviewWire = {
  id: string;
  decision: 0 | 1 | 'ConfirmAi' | 'Override';
  notes: string | null;
  expertId: string;
  reviewedAt: string;
};

export type CaseReviewWire = {
  id: string;
  title: string;
  description?: string | null;
  status: ReportStatus;
  priority: WirePriority;
  reporterId: string;
  assignedExpertId?: string | null;
  /** Strings on the wire, not numbers. Nothing in the expert feature reads them, so nothing maps them. */
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  attachments: IssueAttachmentWire[];
  /** Null when the issue has no analysed attachment. */
  aiAnalysis: ExpertAiAnalysisWire | null;
  expertReviews: ExpertReviewWire[];
};

/** SubmitExpertReviewRequest. Severity and the corrected diagnosis ride inside `notes` - G3. */
export type SubmitReviewBody = {
  decision: 0 | 1;
  notes: string | null;
};

/** ScheduleRepairRequest. `scheduledDate` is a DateOnly, the two slots are TimeOnly. */
export type ScheduleRepairBody = {
  scheduledDate: string;
  slotStart: string;
  slotEnd: string;
  farmerNotified: boolean;
  notes: string | null;
};
