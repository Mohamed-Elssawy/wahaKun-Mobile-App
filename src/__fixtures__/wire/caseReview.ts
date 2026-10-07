// GET /Expert/{issueId}/review - CaseReviewResponse, BACKEND-INTEGRATION-FACTS.md §4.2.
// `unknown` throughout: confidence arrives as 87 as well as 0.87, coordinates arrive as "" and
// as null, and `attachments[].type` is an int with no `purpose` beside it - G4.

export const REPORTER_ID = 'f86295b1-6d2e-4a6f-9d2a-0c1b3e5a7d91';
export const EXPERT_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

/** The doubled bucket segment is the URL MediaStorage really builds, and it 403s as given. */
const PROBLEM_PHOTO = 'http://127.0.0.1:9000/reportimage/reportimage/f8086949.jpg';
const REPAIR_PHOTO = 'http://127.0.0.1:9000/reportimage/reportimage/repair-proof.jpg';

/** IssueAttachmentType as an int: 0 = Photo, 1 = Voice. No `purpose` field exists - G4. */
export const PROBLEM_PHOTO_ATTACHMENT = { id: 'att-1', type: 0, url: PROBLEM_PHOTO };
export const VOICE_ATTACHMENT = { id: 'att-2', type: 1, url: 'reportimage/voice.m4a' };
export const REPAIR_PHOTO_ATTACHMENT = { id: 'att-3', type: 0, url: REPAIR_PHOTO };

/** AiAnalysisResponse. `confidence` is a double the profile parsed out of a string - §2. */
function analysis(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    problemName: 'Pipe_Damage',
    problemArabic: 'تسريب في الأنبوب',
    confidence: 0.87,
    severity: 'حرجة',
    recommendation: 'أوقف مصدر المياه',
    explanation: 'الأنبوب متصدع عند الوصلة',
    repairSteps: ['أوقف المضخة', 'استبدل الوصلة'],
    ...overrides,
  };
}

/** ExpertReviews row. `decision` is an int: 0 = ConfirmAi, 1 = Override. */
function review(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'review-1',
    decision: 0,
    notes: null,
    expertId: EXPERT_ID,
    reviewedAt: '2026-10-05T20:10:00',
    ...overrides,
  };
}

/** `latitude` and `longitude` are STRINGS here, not numbers. */
export function caseReview(overrides: Record<string, unknown> = {}): unknown {
  return {
    id: 'issue-1',
    title: 'تسريب في الأنبوب',
    description: 'ماء على السطح',
    status: 'Assigned',
    priority: 'High',
    reporterId: REPORTER_ID,
    assignedExpertId: EXPERT_ID,
    latitude: '29.2041',
    longitude: '25.5195',
    createdAt: '2026-10-05T19:47:30',
    attachments: [PROBLEM_PHOTO_ATTACHMENT],
    aiAnalysis: analysis(),
    expertReviews: [],
    ...overrides,
  };
}

export const withAnalysis: unknown = caseReview();

/** Null when the issue has no analysed attachment, which is every voice-only report - F13. */
export const noAnalysis: unknown = caseReview({ aiAnalysis: null });

/** The override line composeReviewNotes writes, since G3 leaves it nowhere else to go. */
export const OVERRIDE_NOTES = '[تصحيح] تصدع إنشائي | عالية\nيحتاج دعامة';

/** ConfirmAi first, Override second, in wire order. */
export const twoReviews: unknown = caseReview({
  status: 'Reviewed',
  expertReviews: [
    review({ id: 'review-old', decision: 0, notes: 'تم تأكيد التشخيص' }),
    review({ id: 'review-new', decision: 1, notes: OVERRIDE_NOTES, reviewedAt: '2026-10-05T21:30:00' }),
  ],
});

/** The same two rows newest-first, because no ORDER BY in the spec promises otherwise. */
export const reviewsOutOfOrder: unknown = caseReview({
  status: 'Reviewed',
  expertReviews: [
    review({ id: 'review-new', decision: 1, notes: OVERRIDE_NOTES, reviewedAt: '2026-10-05T21:30:00' }),
    review({ id: 'review-old', decision: 0, notes: 'تم تأكيد التشخيص' }),
  ],
});

/** Problem photo, voice note, then the repair proof - indistinguishable without a purpose - G4. */
export const mixedAttachments: unknown = caseReview({
  status: 'Repaired',
  attachments: [PROBLEM_PHOTO_ATTACHMENT, VOICE_ATTACHMENT, REPAIR_PHOTO_ATTACHMENT],
});

export const noAttachments: unknown = caseReview({ attachments: [] });

export const voiceOnlyAttachments: unknown = caseReview({ attachments: [VOICE_ATTACHMENT] });

/** ParseConfidence stores 87 for "87%" and 0.87 for "0.87", and the sender is unknown - §2. */
export const confidenceAsPercent: unknown = caseReview({ aiAnalysis: analysis({ confidence: 87 }) });

export const confidenceZero: unknown = caseReview({ aiAnalysis: analysis({ confidence: 0 }) });

export const confidenceNull: unknown = caseReview({ aiAnalysis: analysis({ confidence: null }) });

/** No `confidence` key at all, which is what an unparsed string leaves behind. */
export const confidenceMissing: unknown = caseReview({
  aiAnalysis: {
    problemName: 'Pipe_Damage',
    problemArabic: 'تسريب في الأنبوب',
    severity: 'حرجة',
    recommendation: 'أوقف مصدر المياه',
    explanation: null,
    repairSteps: [],
  },
});

/** An eleventh severity: the vision service sends SeverityLevel.value verbatim and may grow it. */
export const unknownSeverity: unknown = caseReview({
  aiAnalysis: analysis({ severity: 'شديدة الخطورة' }),
});

export const coordsEmpty: unknown = caseReview({ latitude: '', longitude: '' });

export const coordsNull: unknown = caseReview({ latitude: null, longitude: null });

/** Every nullable field null at once, for the sweep that proves nothing renders as "undefined". */
export const everyNullableNull: unknown = caseReview({
  description: null,
  assignedExpertId: null,
  latitude: null,
  longitude: null,
  attachments: [],
  aiAnalysis: null,
});
