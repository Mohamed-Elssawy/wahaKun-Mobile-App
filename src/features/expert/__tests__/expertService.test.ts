import { ApiError } from '@/api';
import type { ReportStatus } from '@/features/reports/types';

import {
  composeReviewNotes,
  expertFacts,
  isEmptyResultError,
  isServerRefusal,
  parseReviewNotes,
} from '../services/expertService';

const REVIEW_REFUSAL = 'Only assigned issues can be reviewed';

/** The shape client.ts builds: no `code`, because IssueService maps no exception to a status. */
function serverError(status: number, serverMessage?: string): ApiError {
  return ApiError.fromResponse(status, { serverMessage });
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

  it('returns nothing for null, empty and whitespace', () => {
    expect(parseReviewNotes(null)).toEqual({});
    expect(parseReviewNotes(undefined)).toEqual({});
    expect(parseReviewNotes('')).toEqual({});
    expect(parseReviewNotes('   ')).toEqual({});
  });
});

describe('expertFacts', () => {
  // The expert adapter's own table. factsFromWireStatus stays conservative for the farmer, so
  // Scheduled/Repaired/completed only read as reviewed here.
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
    const [lifecycle, hasAiAnalysis, hasExpertReview, hasAppointment, hasRepairConfirmation] =
      EXPECTED[status];

    expect(expertFacts(status as ReportStatus, 0)).toEqual({
      status: lifecycle,
      hasAiAnalysis,
      hasExpertReview,
      hasAppointment,
      hasRepairConfirmation,
    });
  });

  it.each(Object.keys(EXPECTED))('marks %s as reviewed once a review exists', status => {
    const [lifecycle, hasAiAnalysis, , hasAppointment, hasRepairConfirmation] = EXPECTED[status];

    expect(expertFacts(status as ReportStatus, 1)).toEqual({
      status: lifecycle,
      hasAiAnalysis,
      hasExpertReview: true,
      hasAppointment,
      hasRepairConfirmation,
    });
  });

  it('falls back to New on a status the server grew after this file', () => {
    expect(expertFacts('Escalated' as ReportStatus, 0).status).toBe('New');
  });
});

describe('isServerRefusal', () => {
  it('matches only when the status and the message both match', () => {
    expect(isServerRefusal(serverError(500, `…${REVIEW_REFUSAL}.`), REVIEW_REFUSAL)).toBe(true);
  });

  it('rejects the right message on another status', () => {
    expect(isServerRefusal(serverError(400, REVIEW_REFUSAL), REVIEW_REFUSAL)).toBe(false);
    expect(isServerRefusal(serverError(404, REVIEW_REFUSAL), REVIEW_REFUSAL)).toBe(false);
  });

  it('rejects a bare 500, so a real outage still reads as an outage', () => {
    expect(isServerRefusal(serverError(500), REVIEW_REFUSAL)).toBe(false);
    expect(isServerRefusal(serverError(500, 'Object reference not set'), REVIEW_REFUSAL)).toBe(
      false,
    );
  });

  it('rejects anything that is not an ApiError', () => {
    expect(isServerRefusal(new Error(REVIEW_REFUSAL), REVIEW_REFUSAL)).toBe(false);
    expect(isServerRefusal(null, REVIEW_REFUSAL)).toBe(false);
  });
});

describe('isEmptyResultError', () => {
  it('matches the empty inbox exception', () => {
    expect(
      isEmptyResultError(
        serverError(
          500,
          'System.Collections.Generic.KeyNotFoundException: No issues were found.',
        ),
      ),
    ).toBe(true);
  });

  it('rejects a bare 500 and the same message on another status', () => {
    expect(isEmptyResultError(serverError(500))).toBe(false);
    expect(isEmptyResultError(serverError(404, 'No issues were found.'))).toBe(false);
  });

  it('rejects the other IssueService refusals', () => {
    expect(isEmptyResultError(serverError(500, REVIEW_REFUSAL))).toBe(false);
  });
});
