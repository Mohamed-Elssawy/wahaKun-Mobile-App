import {
  confidenceAsPercent,
  confidenceMissing,
  confidenceNull,
  confidenceZero,
  coordsEmpty,
  coordsNull,
  everyNullableNull,
  mixedAttachments,
  noAnalysis,
  noAttachments,
  PROBLEM_PHOTO_ATTACHMENT,
  reviewsOutOfOrder,
  twoOverrides,
  twoReviews,
  voiceOnlyAttachments,
  withAnalysis,
} from '@/__fixtures__/wire/caseReview';
import { API_BASE_URLS } from '@/config/env';
import { resolveAttachmentUrl } from '@/features/reports/services/reportService';

import { getCaseDetail } from '../services/expertService';

import type { ExpertCaseDetail } from '../types';

const mockGet = jest.fn();

jest.mock('@/api', () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args) },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
  ApiError: jest.requireActual('@/api/errors').ApiError,
  getTokenUserId: jest.fn(),
}));

/** Every case here is one call to GET /Expert/{issueId}/review, so one handler covers them all. */
function serve(payload: unknown): void {
  mockGet.mockResolvedValue(payload);
}

function detailFrom(payload: unknown): Promise<ExpertCaseDetail> {
  serve(payload);
  return getCaseDetail('issue-1');
}

/** A blank field renders as nothing rather than as an error, so this class never shows on a device. */
function brokenValues(mapped: object): string[] {
  return Object.entries(mapped)
    .filter(([, value]) => Number.isNaN(value) || value === 'undefined' || value === 'null')
    .map(([key]) => key);
}

beforeEach(() => mockGet.mockReset());

describe('getCaseDetail against GET /Expert/{issueId}/review', () => {
  it('asks for the path ExpertController routes', async () => {
    await detailFrom(withAnalysis);

    expect(mockGet).toHaveBeenCalledWith(API_BASE_URLS.issue, '/Expert/issue-1/review', {
      authenticated: true,
    });
  });

  it('fills the screen from the analysis block', async () => {
    const detail = await detailFrom(withAnalysis);

    expect(detail).toMatchObject({
      reportId: 'issue-1',
      title: 'تسريب في الأنبوب',
      description: 'ماء على السطح',
      severity: 'حرجة',
      recommendation: 'أوقف مصدر المياه',
      explanation: 'الأنبوب متصدع عند الوصلة',
    });
  });

  // Null on every voice-only report, since nothing analyses audio at all - F13.
  it('falls back to the priority when aiAnalysis is null', async () => {
    const detail = await detailFrom(noAnalysis);

    expect(detail.severity).toBe('عالية');
    expect(detail.confidence).toBe(0);
    expect(detail.recommendation).toBeUndefined();
    expect(detail.explanation).toBeUndefined();
  });
});

describe('expertReviews', () => {
  // Newest last, and the newest is the Override, so it is the decision E-03 reads back.
  it('reads the override off the newest review', async () => {
    const detail = await detailFrom(twoReviews);

    expect(detail.currentOverride).toEqual({
      severity: 'عالية',
      correctedDiagnosis: 'تصدع إنشائي',
    });
    // The older row is a ConfirmAi, which carries no correction to show.
    expect(detail.previousReview).toBeUndefined();
    expect(detail.hasExpertReview).toBe(true);
  });

  // Sorted through toUtcTimestamp: a naive reviewedAt must not reorder the two.
  it('sorts by reviewedAt rather than trusting wire order', async () => {
    const [ordered, reversed] = [
      await detailFrom(twoReviews),
      await detailFrom(reviewsOutOfOrder),
    ];

    expect(reversed.currentOverride).toEqual(ordered.currentOverride);
  });

  // Only a reopen could produce this, so G2/F10 is why the branch has never run in anger.
  it('keeps the cycle before the last one as previousReview', async () => {
    const detail = await detailFrom(twoOverrides);

    expect(detail.currentOverride).toEqual({
      severity: 'عالية',
      correctedDiagnosis: 'تصدع إنشائي',
    });
    expect(detail.previousReview).toEqual({
      severity: 'متوسطة',
      correctedDiagnosis: 'انسداد جزئي',
      expertNote: 'ملاحظة قديمة',
    });
  });
});

describe('attachments', () => {
  // First, not last: the repair proof is appended at resolution time and carries no purpose - G4.
  it('takes the first photo and re-points it at MediaStorage', async () => {
    const detail = await detailFrom(mixedAttachments);

    expect(detail.photoUrl).toBe(resolveAttachmentUrl(PROBLEM_PHOTO_ATTACHMENT.url));
    expect(detail.photoUrl).toBe(
      `${API_BASE_URLS.media}/storage?objectName=reportimage%2Ff8086949.jpg`,
    );
  });

  it('shows no photo for an empty attachment list', async () => {
    expect((await detailFrom(noAttachments)).photoUrl).toBeUndefined();
  });

  // type 1 is Voice. Treating it as the problem photo would put an audio file in an <Image>.
  it('shows no photo when every attachment is a voice note', async () => {
    expect((await detailFrom(voiceOnlyAttachments)).photoUrl).toBeUndefined();
  });
});

describe('confidence off the wire', () => {
  // §4.2 calls it 0..1 and §2 says treat anything over 1 as a percentage. §2 wins.
  it('divides a percentage by one hundred', async () => {
    expect((await detailFrom(confidenceAsPercent)).confidence).toBeCloseTo(0.87);
  });

  it('leaves a value already in range untouched', async () => {
    expect((await detailFrom(withAnalysis)).confidence).toBe(0.87);
  });

  it.each([
    ['zero', confidenceZero],
    ['null', confidenceNull],
    ['absent', confidenceMissing],
  ])('reads a %s confidence as no confidence', async (_name, payload) => {
    const detail = await detailFrom(payload);

    expect(detail.confidence).toBe(0);
    expect(Number.isNaN(detail.confidence)).toBe(false);
  });
});

describe('what CaseReviewResponse carries and the screen cannot use', () => {
  // Strings on the wire, and the expert feature reads neither - there is nowhere to put them.
  it.each([
    ['as strings', withAnalysis],
    ['as empty strings', coordsEmpty],
    ['as null', coordsNull],
  ])('drops the coordinates sent %s', async (_name, payload) => {
    const detail = await detailFrom(payload);

    expect(detail).not.toHaveProperty('latitude');
    expect(detail).not.toHaveProperty('longitude');
  });

  // G4/G9: the payload carries neither the repair schedule nor the attachment purpose.
  it('reads back no appointment and no repair', async () => {
    const detail = await detailFrom(mixedAttachments);

    expect(detail.appointment).toBeUndefined();
    expect(detail.repair).toBeUndefined();
  });

  it('marks the naive createdAt as UTC here too', async () => {
    expect((await detailFrom(withAnalysis)).createdAt).toBe('2026-10-05T19:47:30Z');
  });

  it('puts no NaN and no stringified null on the detail', async () => {
    expect(brokenValues(await detailFrom(everyNullableNull))).toEqual([]);
  });
});
