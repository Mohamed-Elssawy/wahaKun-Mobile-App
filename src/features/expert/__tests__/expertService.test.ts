import { API_ENDPOINTS, ApiError } from '@/api';
import { API_BASE_URLS } from '@/config/env';
import type { ReportStatus } from '@/features/reports/types';

import {
  classifyExpertError,
  composeReviewNotes,
  expertFacts,
  parseReviewNotes,
  problemPhotoAttachment,
  toCaseDetail,
} from '../services/expertService';

import type { CaseReviewWire } from '../types';

/** Kept only so the regression guard can prove it buys nothing: no branch may turn on it. */
const DELETED_REVIEW_PHRASE = 'Only assigned issues can be reviewed';

const BASE = API_BASE_URLS.issue;
const INBOX_URL = `${BASE}${API_ENDPOINTS.issue.inbox(10, 1, 2)}`;
const REVIEW_URL = `${BASE}${API_ENDPOINTS.issue.review('issue-1')}`;

/** A text-only 500, which is what the dev exception page used to produce and no deployment does. */
function serverError(status: number, serverMessage?: string): ApiError {
  return ApiError.fromResponse(status, {
    url: REVIEW_URL,
    body: serverMessage,
    serverMessage,
  });
}

/** Shapes A and B: the code envelope, as `client.ts`'s `parseErrorBody` reads it. */
function envelope(
  status: number,
  code: string,
  message: string,
  traceId?: string,
): ApiError {
  return ApiError.fromResponse(status, {
    url: REVIEW_URL,
    body: { status, code, message, traceId },
    code,
    serverMessage: message,
    traceId,
  });
}

/** Shape D: a zero-length body, which leaves `client.ts` with no code and no serverMessage. */
function emptyBody(status: number, url: string): ApiError {
  return ApiError.fromResponse(status, { url, body: null });
}

describe('composeReviewNotes', () => {
  it('writes the override line, then the note', () => {
    expect(
      composeReviewNotes({
        reportId: '1',
        override: { severity: 'عالية', correctedDiagnosis: 'تصدع إنشائي' },
        expertNote: 'يحتاج دعامة',
      }),
    ).toBe('[تصحيح] تصدع إنشائي | عالية\nيحتاج دعامة');
  });

  it('writes the override line alone when there is no note', () => {
    expect(
      composeReviewNotes({
        reportId: '1',
        override: { severity: 'حرجة', correctedDiagnosis: 'كسر كامل' },
      }),
    ).toBe('[تصحيح] كسر كامل | حرجة');
  });

  it('writes the note alone when the toggle was off', () => {
    expect(composeReviewNotes({ reportId: '1', expertNote: 'لا ملاحظات إضافية' })).toBe(
      'لا ملاحظات إضافية',
    );
  });

  it('sends null when neither half is set', () => {
    expect(composeReviewNotes({ reportId: '1' })).toBeNull();
  });
});

describe('parseReviewNotes', () => {
  it('round-trips an override and a note', () => {
    const fields = {
      reportId: '1',
      override: { severity: 'عالية' as const, correctedDiagnosis: 'تصدع إنشائي' },
      expertNote: 'يحتاج دعامة',
    };

    expect(parseReviewNotes(composeReviewNotes(fields))).toEqual({
      override: fields.override,
      expertNote: fields.expertNote,
    });
  });

  it('round-trips an override with no note', () => {
    const fields = {
      reportId: '1',
      override: { severity: 'حرجة' as const, correctedDiagnosis: 'كسر كامل' },
    };

    expect(parseReviewNotes(composeReviewNotes(fields))).toEqual({
      override: fields.override,
      expertNote: undefined,
    });
  });

  it('keeps every line of a multi-line note', () => {
    const expertNote = 'السطر الأول\nالسطر الثاني\nالسطر الثالث';
    const fields = {
      reportId: '1',
      override: { severity: 'متوسطة' as const, correctedDiagnosis: 'انسداد جزئي' },
      expertNote,
    };

    expect(parseReviewNotes(composeReviewNotes(fields)).expertNote).toBe(expertNote);
  });

  it('keeps a multi-line note that has no override line', () => {
    const expertNote = 'السطر الأول\nالسطر الثاني';
    expect(parseReviewNotes(expertNote)).toEqual({ expertNote });
  });

  it('splits at the last pipe, so a diagnosis may contain one', () => {
    expect(parseReviewNotes('[تصحيح] تسرب | عند الوصلة | عالية')).toEqual({
      override: { severity: 'عالية', correctedDiagnosis: 'تسرب | عند الوصلة' },
      expertNote: undefined,
    });
  });

  it('reads a prefixed line with no pipe as a plain note, never half an override', () => {
    const notes = '[تصحيح] تصدع إنشائي بلا فاصل';
    expect(parseReviewNotes(notes)).toEqual({ expertNote: notes });
  });

  it('reads a prefixed line with an empty severity as a plain note', () => {
    const notes = '[تصحيح] تصدع إنشائي |';
    expect(parseReviewNotes(notes)).toEqual({ expertNote: notes });
  });

  // Unreachable: canSubmit requires a diagnosis, so only a hand-edited note reaches the parser.
  it('reads a prefixed line with an empty diagnosis as a plain note (unreachable from the client)', () => {
    const notes = '[تصحيح] | عالية';
    expect(parseReviewNotes(notes)).toEqual({ expertNote: notes });
  });

  it('reads a bare prefix with nothing after it as a plain note (unreachable from the client)', () => {
    const notes = '[تصحيح]';
    expect(parseReviewNotes(notes)).toEqual({ expertNote: notes });
  });

  it('returns nothing for null, empty and whitespace', () => {
    expect(parseReviewNotes(null)).toEqual({});
    expect(parseReviewNotes(undefined)).toEqual({});
    expect(parseReviewNotes('')).toEqual({});
    expect(parseReviewNotes('   ')).toEqual({});
  });
});

describe('expertFacts', () => {
  // factsFromWireStatus stays conservative for the farmer, so only these read as reviewed here.
  const EXPECTED: Record<string, [string, boolean, boolean, boolean, boolean]> = {
    Reported: ['New', false, false, false, false],
    Diagnosed: ['New', true, false, false, false],
    Assigned: ['UnderReview', true, false, false, false],
    Reviewed: ['UnderReview', true, true, false, false],
    Scheduled: ['Scheduled', true, true, true, false],
    Repaired: ['Scheduled', true, true, true, true],
    completed: ['Resolved', true, true, true, true],
  };

  it.each(Object.keys(EXPECTED))('places %s with no review on record', status => {
    const [
      lifecycle,
      hasAiAnalysis,
      hasExpertReview,
      hasAppointment,
      hasRepairConfirmation,
    ] = EXPECTED[status];

    expect(expertFacts(status as ReportStatus, 0)).toEqual({
      status: lifecycle,
      hasAiAnalysis,
      hasExpertReview,
      hasAppointment,
      hasRepairConfirmation,
    });
  });

  it.each(Object.keys(EXPECTED))('marks %s as reviewed once a review exists', status => {
    const [lifecycle, hasAiAnalysis, , hasAppointment, hasRepairConfirmation] =
      EXPECTED[status];

    expect(expertFacts(status as ReportStatus, 1)).toEqual({
      status: lifecycle,
      hasAiAnalysis,
      hasExpertReview: true,
      hasAppointment,
      hasRepairConfirmation,
    });
  });

  it('falls back to New on a status the server grew after this file, warning once', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      expect(expertFacts('Escalated' as ReportStatus, 0).status).toBe('New');
      expect(expertFacts('Escalated' as ReportStatus, 0).status).toBe('New');
      // Once per distinct value, so an unknown status on a 50-row inbox is not 50 lines.
      expect(warn).toHaveBeenCalledTimes(1);

      expect(expertFacts('Quarantined' as ReportStatus, 0).status).toBe('New');
      expect(warn).toHaveBeenCalledTimes(2);
    } finally {
      warn.mockRestore();
    }
  });
});

/** One case per branch, named with the probe row that observed it. */
describe('classifyExpertError', () => {
  it.each([
    // C10 is a farmer route: on /Expert/* a missing row is an empty 500, so this is tolerance only.
    [
      'the ISSUE_NOT_FOUND envelope, C10',
      envelope(404, 'ISSUE_NOT_FOUND', 'Issue not found.'),
      'issueNotFound',
    ],
    [
      'D2 - shape B, with a traceId',
      envelope(400, 'INVALID_OPERATION', 'لا يمكن', '0HNP:02'),
      'invalidOperation',
    ],
    ['C13 - the role guard on the inbox', emptyBody(403, INBOX_URL), 'wrongRole'],
    // C13 covers the review route too, re-verified 2026-10-17; the probe only tried the inbox.
    ['C13 - the role guard on the review', emptyBody(403, REVIEW_URL), 'wrongRole'],
    ['I5 - not the assigned expert', emptyBody(500, REVIEW_URL), 'notAssigned'],
    // C11, the same shape for a reason the client cannot distinguish. Both read as the refusal.
    ['C11 - a missing row on an expert route', emptyBody(500, REVIEW_URL), 'notAssigned'],
  ])('reads %s', (_name, error, expected) => {
    expect(classifyExpertError(error)).toBe(expected);
  });

  // The vocabulary is two codes deep because somebody looked once. A third must not be guessed.
  it('reads a code it has never seen as unknown, and says so once', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      expect(classifyExpertError(envelope(400, 'TOKEN_EXPIRED', 'انتهت جلستك'))).toBe(
        'unknown',
      );
      expect(classifyExpertError(envelope(400, 'TOKEN_EXPIRED', 'انتهت جلستك'))).toBe(
        'unknown',
      );

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('UNKNOWN_CODE');
      // Verbatim, so the log is enough to add the row without reproducing the call.
      expect(warn.mock.calls[0][0]).toContain('TOKEN_EXPIRED');
    } finally {
      warn.mockRestore();
    }
  });

  it('reads anything that is not an ApiError as unknown', () => {
    expect(classifyExpertError(new Error('boom'))).toBe('unknown');
    expect(classifyExpertError(null)).toBe('unknown');
  });

  // An empty 500 outside /Expert/* is somebody else's outage, not an assignment refusal.
  it('does not read a 500 on another service as a non-assignment', () => {
    expect(classifyExpertError(emptyBody(500, `${BASE}/Farmer/issue-1/tracking`))).toBe(
      'unknown',
    );
  });

  // The casing cost a day on /api/storage, so the route test is case-insensitive.
  it('matches the expert route whatever case the path arrives in', () => {
    expect(classifyExpertError(emptyBody(500, REVIEW_URL.toLowerCase()))).toBe(
      'notAssigned',
    );
    expect(classifyExpertError(emptyBody(500, REVIEW_URL.toUpperCase()))).toBe(
      'notAssigned',
    );
  });

  /** Regression guard: both carry the deleted phrase, and neither may read as a refusal. */
  it.each([
    ['a 400 carrying the old refusal phrase', serverError(400, DELETED_REVIEW_PHRASE)],
    [
      'a 500 carrying it with a stack',
      serverError(500, `${DELETED_REVIEW_PHRASE}\n   at Issue…`),
    ],
    [
      'the old empty-inbox phrase',
      serverError(500, 'KeyNotFoundException: No issues were found.'),
    ],
  ])('never classifies on message text: %s', (_name, error) => {
    expect(classifyExpertError(error)).toBe('unknown');
  });
});

// Enums arrive by name since JsonStringEnumConverter was registered; requests still bind ints.
describe('toCaseDetail enum names', () => {
  const wire = (overrides: Partial<CaseReviewWire>): CaseReviewWire => ({
    id: '3f2b8c1e-5d4a-4b7e-9c2a-1e6f8d0a7b3c',
    title: 'تسريب',
    status: 'Assigned',
    priority: 'High',
    reporterId: 'u1',
    latitude: null,
    longitude: null,
    createdAt: '2026-10-09T08:00:00',
    attachments: [],
    aiAnalysis: null,
    expertReviews: [],
    ...overrides,
  });

  // Asserted on the attachment: the zero-byte contract means a resolved URL is no longer observable.
  it('finds the farmer\'s photo when the attachment type arrives as "Photo"', () => {
    const photo = problemPhotoAttachment([
      { id: 'a2', type: 'Voice', url: 'issues/note.m4a' },
      { id: 'a1', type: 'Photo', url: 'issues/photo.jpg' },
    ]);

    expect(photo?.url).toBe('issues/photo.jpg');
  });

  it('still reads the integer form, should the converter ever be removed', () => {
    expect(
      problemPhotoAttachment([{ id: 'a1', type: 0, url: 'issues/photo.jpg' }])?.url,
    ).toBe('issues/photo.jpg');
  });

  it('reads back an override whose decision arrives as "Override"', () => {
    const notes = composeReviewNotes({
      reportId: 'r1',
      override: { severity: 'عالية', correctedDiagnosis: 'كسر في الماسورة' },
    });

    const detail = toCaseDetail(
      wire({
        expertReviews: [
          {
            id: 'v1',
            decision: 'Override',
            notes,
            expertId: 'e1',
            reviewedAt: '2026-10-09T09:00:00',
          },
        ],
      }),
    );

    expect(detail.currentOverride).toEqual({
      severity: 'عالية',
      correctedDiagnosis: 'كسر في الماسورة',
    });
  });

  it('reads no override from a "ConfirmAi" review', () => {
    const detail = toCaseDetail(
      wire({
        expertReviews: [
          {
            id: 'v1',
            decision: 'ConfirmAi',
            notes: null,
            expertId: 'e1',
            reviewedAt: '2026-10-09T09:00:00',
          },
        ],
      }),
    );

    expect(detail.currentOverride).toBeUndefined();
  });
});
