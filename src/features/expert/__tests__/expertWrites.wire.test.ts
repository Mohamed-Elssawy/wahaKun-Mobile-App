import { caseReview } from '@/__fixtures__/wire/caseReview';
import {
  resolutionResponse,
  scheduleResponse,
  submitReviewResponse,
} from '@/__fixtures__/wire/expertWrites';
import { ApiError, STATUS_MESSAGES } from '@/api';
import { API_BASE_URLS, UPLOAD_TIMEOUT_MS } from '@/config/env';

import {
  composeReviewNotes,
  confirmAppointment,
  confirmRepair,
  getCaseDetail,
  parseReviewNotes,
  submitReview,
} from '../services/expertService';

import type { SubmitExpertReviewFields } from '../types';

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('@/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
  ApiError: jest.requireActual('@/api/errors').ApiError,
  STATUS_MESSAGES: jest.requireActual('@/api/errorMessages').STATUS_MESSAGES,
  getTokenUserId: jest.fn(),
}));

const PHOTO = { uri: 'file:///cache/repair.jpg', type: 'image/png', fileName: 'repair.png' };

/** The shape client.ts builds: no `code`, because IssueService maps no exception to a status. */
function serverError(status: number, serverMessage?: string): ApiError {
  return ApiError.fromResponse(status, { serverMessage });
}

function bodyOf(call: unknown[]): Record<string, unknown> {
  return call[2] as Record<string, unknown>;
}

/** RN's own FormData declares only append and getParts, so the reader side needs its own type. */
type InspectableFormData = {
  entries: () => Iterable<[string, unknown]>;
  get: (name: string) => unknown;
};

/** The whatwg FormData in this runtime stringifies the RN file descriptor, so assert the names. */
function partNames(body: unknown): string[] {
  return Array.from((body as InspectableFormData).entries()).map(([name]) => name);
}

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('POST /Expert/{issueId}/review', () => {
  it('sends decision 1 and the override line when the toggle was on', async () => {
    mockPost.mockResolvedValue(submitReviewResponse);

    await submitReview({
      reportId: 'issue-1',
      override: { severity: 'عالية', correctedDiagnosis: 'تصدع إنشائي' },
      expertNote: 'يحتاج دعامة',
    });

    expect(mockPost).toHaveBeenCalledWith(
      API_BASE_URLS.issue,
      '/Expert/issue-1/review',
      { decision: 1, notes: '[تصحيح] تصدع إنشائي | عالية\nيحتاج دعامة' },
      { authenticated: true },
    );
  });

  it('sends decision 0 and a null note when the expert changed nothing', async () => {
    mockPost.mockResolvedValue(submitReviewResponse);

    await submitReview({ reportId: 'issue-1' });

    expect(bodyOf(mockPost.mock.calls[0])).toEqual({ decision: 0, notes: null });
  });

  // A second submission always hits this: the first one moved the case off Assigned.
  it('rebuilds the refusal as the 409 the server has no middleware to send', async () => {
    mockPost.mockRejectedValue(
      serverError(500, 'System.InvalidOperationException: Only assigned issues can be reviewed.'),
    );

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({
      status: 409,
      kind: 'conflict',
      // "this may already be done", not the 500's "retry later" - which would fail forever.
      userMessage: STATUS_MESSAGES[409],
    });
  });

  it('lets a real 500 through as a 500', async () => {
    mockPost.mockRejectedValue(serverError(500, 'System.NullReferenceException'));

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({ status: 500 });
  });
});

describe('POST /Expert/{issueId}/schedule', () => {
  // DateOnly and two TimeOnly values; the slot length is this app's assumption, not the spec's.
  it('sends the DateOnly and the TimeOnly pair ScheduleRepairRequest binds', async () => {
    mockPost.mockResolvedValue(scheduleResponse);

    await confirmAppointment({
      reportId: 'issue-1',
      date: '2026-10-09',
      slot: '9:00 ص',
      noteToFarmer: 'سأصل في الموعد',
    });

    expect(bodyOf(mockPost.mock.calls[0])).toEqual({
      scheduledDate: '2026-10-09',
      slotStart: '09:00:00',
      slotEnd: '11:00:00',
      farmerNotified: true,
      notes: 'سأصل في الموعد',
    });
  });

  it('sends a null note rather than omitting the field', async () => {
    mockPost.mockResolvedValue(scheduleResponse);

    await confirmAppointment({ reportId: 'issue-1', date: '2026-10-09', slot: '7:00 ص' });

    expect(bodyOf(mockPost.mock.calls[0])).toMatchObject({ notes: null });
  });
});

describe('POST /Expert/{issueId}/resolution', () => {
  it('sends multipart with the parts named Photo and Notes', async () => {
    mockPost.mockResolvedValue(resolutionResponse);

    await confirmRepair({ reportId: 'issue-1', photo: PHOTO, notes: 'تم استبدال الوصلة' });

    const [base, path, body, options] = mockPost.mock.calls[0];

    expect([base, path]).toEqual([API_BASE_URLS.issue, '/Expert/issue-1/resolution']);
    expect(partNames(body)).toEqual(['Photo', 'Notes']);
    expect((body as InspectableFormData).get('Notes')).toBe('تم استبدال الوصلة');
    // Aborting a multipart body the server is still writing is what makes duplicates.
    expect(options).toEqual({ authenticated: true, timeoutMs: UPLOAD_TIMEOUT_MS });
  });

  it('rebuilds the scheduled-only refusal as a 409', async () => {
    mockPost.mockRejectedValue(
      serverError(
        500,
        'System.InvalidOperationException: Resolution action can only be created for a scheduled issue.',
      ),
    );

    await expect(
      confirmRepair({ reportId: 'issue-1', photo: PHOTO, notes: 'ملاحظة' }),
    ).rejects.toMatchObject({ status: 409, userMessage: STATUS_MESSAGES[409] });
  });
});

// All three are Promise<void> over post<unknown>. The fixtures pin what is thrown away:
// SubmitExpertReviewResponse.status would let the app confirm the transition instead of
// assuming it, and RepairScheduleResponse.id is the only handle on the schedule row.
describe('the success bodies, every one discarded', () => {
  it.each([
    ['review', submitReviewResponse, () => submitReview({ reportId: 'issue-1' })],
    [
      'schedule',
      scheduleResponse,
      () => confirmAppointment({ reportId: 'issue-1', date: '2026-10-09', slot: '9:00 ص' }),
    ],
    [
      'resolution',
      resolutionResponse,
      () => confirmRepair({ reportId: 'issue-1', photo: PHOTO, notes: 'ملاحظة' }),
    ],
  ])('resolves to undefined on the %s response', async (_name, response, call) => {
    mockPost.mockResolvedValue(response);

    await expect(call()).resolves.toBeUndefined();
  });
});

// G3: there is no field for the corrected severity and none for the corrected diagnosis, so
// both ride inside `notes`. These are the two halves of that encoding meeting each other.
describe('composeReviewNotes to parseReviewNotes', () => {
  const OVERRIDE = { severity: 'حرجة' as const, correctedDiagnosis: 'كسر كامل' };

  it('round-trips an override with no note', () => {
    const fields: SubmitExpertReviewFields = { reportId: 'issue-1', override: OVERRIDE };

    expect(parseReviewNotes(composeReviewNotes(fields))).toEqual({
      override: OVERRIDE,
      expertNote: undefined,
    });
  });

  it('round-trips a note with no override', () => {
    const expertNote = 'لا ملاحظات إضافية';

    expect(parseReviewNotes(composeReviewNotes({ reportId: 'issue-1', expertNote }))).toEqual({
      expertNote,
    });
  });

  it('round-trips both halves', () => {
    const expertNote = 'يحتاج دعامة';
    const fields: SubmitExpertReviewFields = {
      reportId: 'issue-1',
      override: OVERRIDE,
      expertNote,
    };

    expect(parseReviewNotes(composeReviewNotes(fields))).toEqual({
      override: OVERRIDE,
      expertNote,
    });
  });

  it('round-trips neither half as nothing at all', () => {
    expect(composeReviewNotes({ reportId: 'issue-1' })).toBeNull();
    expect(parseReviewNotes(composeReviewNotes({ reportId: 'issue-1' }))).toEqual({});
  });

  // Only the first newline is a separator, so a note of several lines survives whole.
  it('keeps every line of a multi-line note', () => {
    const expertNote = 'السطر الأول\nالسطر الثاني\nالسطر الثالث';
    const fields: SubmitExpertReviewFields = {
      reportId: 'issue-1',
      override: OVERRIDE,
      expertNote,
    };

    expect(parseReviewNotes(composeReviewNotes(fields))).toEqual({ override: OVERRIDE, expertNote });
  });

  // The last separator, not the first: a diagnosis is free text and none of the ten severities
  // contains a pipe.
  it('round-trips a diagnosis containing a pipe', () => {
    const override = { severity: 'عالية' as const, correctedDiagnosis: 'تسرب | عند الوصلة' };

    expect(parseReviewNotes(composeReviewNotes({ reportId: 'issue-1', override }))).toEqual({
      override,
      expertNote: undefined,
    });
  });

  it('round-trips a note that itself begins with the override prefix', () => {
    const expertNote = '[تصحيح] راجع التشخيص السابق';

    expect(parseReviewNotes(composeReviewNotes({ reportId: 'issue-1', expertNote }))).toEqual({
      expertNote,
    });
  });

  // The ambiguity the encoding cannot avoid, and the reason it does not bite in practice.
  it('misreads such a note on its own once it also contains a pipe', () => {
    const expertNote = '[تصحيح] راجع | التشخيص السابق';

    expect(parseReviewNotes(expertNote)).toEqual({
      override: { severity: 'التشخيص السابق', correctedDiagnosis: 'راجع' },
      expertNote: undefined,
    });
  });

  // Because `decision` is on the wire beside the notes, and toReviewHistory reads the override
  // only off decision 1 - which composeReviewNotes never sends for a note-only submission.
  it('does not misread it through the real round trip, because decision says 0', async () => {
    const expertNote = '[تصحيح] راجع | التشخيص السابق';
    mockPost.mockResolvedValue(submitReviewResponse);

    await submitReview({ reportId: 'issue-1', expertNote });
    const sent = bodyOf(mockPost.mock.calls[0]);
    mockGet.mockResolvedValue(
      caseReview({
        status: 'Reviewed',
        expertReviews: [
          {
            id: 'review-1',
            decision: sent.decision,
            notes: sent.notes,
            expertId: 'e-1',
            reviewedAt: '2026-10-05T20:10:00',
          },
        ],
      }),
    );

    expect(sent.decision).toBe(0);
    expect((await getCaseDetail('issue-1')).currentOverride).toBeUndefined();
  });
});
