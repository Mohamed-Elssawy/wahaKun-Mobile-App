import type { LifecycleFacts } from '@/features/reports/lifecycle';
import type { Severity } from '@/features/reports/types';

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
};
