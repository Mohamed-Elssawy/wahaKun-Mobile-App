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
  probeCaseReview,
  PROBE_FIRST_PHOTO,
  PROBE_LAST_PHOTO,
  PROBE_LATITUDE,
  PROBE_LONGITUDE,
  PROBLEM_PHOTO_ATTACHMENT,
  reviewsOutOfOrder,
  twoOverrides,
  twoReviews,
  VOICE_ATTACHMENT,
  voiceOnlyAttachments,
  withAnalysis,
} from '@/__fixtures__/wire/caseReview';
import { API_BASE_URLS } from '@/config/env';
import { resolveAttachmentUrl } from '@/features/reports/services/reportService';

import { getCaseDetail, problemPhotoAttachment } from '../services/expertService';

import type { ExpertCaseDetail, IssueAttachmentWire } from '../types';

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
    .filter(
      ([, value]) => Number.isNaN(value) || value === 'undefined' || value === 'null',
    )
    .map(([key]) => key);
}

/** Every string anywhere in a mapped object, however deep, so a sweep cannot miss a field. */
function everyString(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(everyString);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(everyString);
  }
  return [];
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

/** G4: attachments[] carries no purpose, so order is the only heuristic PROBE I4 leaves. */
describe('the G4 ordering heuristic', () => {
  it("reads the first photo as the farmer's own, on PROBE I4's real pair", () => {
    const attachments = (probeCaseReview as { attachments: IssueAttachmentWire[] })
      .attachments;

    expect(attachments).toHaveLength(2);
    expect(attachments.every(attachment => attachment.type === 'Photo')).toBe(true);
    attachments.forEach(attachment => expect(attachment).not.toHaveProperty('purpose'));

    expect(problemPhotoAttachment(attachments)?.url).toBe(PROBE_FIRST_PHOTO);
    // The one the heuristic must NOT pick: appended at resolution time on a Repaired case.
    expect(problemPhotoAttachment(attachments)?.url).not.toBe(PROBE_LAST_PHOTO);
  });

  // type 1 is Voice. Treating it as the problem photo would put an audio file in an <Image>.
  it('skips a voice note, in either enum form', () => {
    // Cast at the boundary: the fixtures hold what the wire sends, which the types narrow.
    const voiceFirst = [
      VOICE_ATTACHMENT,
      PROBLEM_PHOTO_ATTACHMENT,
    ] as IssueAttachmentWire[];

    expect(problemPhotoAttachment(voiceFirst)?.id).toBe(PROBLEM_PHOTO_ATTACHMENT.id);
    expect(
      problemPhotoAttachment([VOICE_ATTACHMENT] as IssueAttachmentWire[]),
    ).toBeUndefined();
  });

  it('finds nothing in an empty list', () => {
    expect(problemPhotoAttachment([])).toBeUndefined();
  });
});

/** An attachment whose bytes cannot be fetched is not an attachment: consumers get undefined. */
describe('the attachment contract', () => {
  // Storage serves bytes, so the FIRST photo resolves and G4's ordering is what picks it.
  it.each([
    ['two real photos', probeCaseReview, PROBE_FIRST_PHOTO],
    ['one photo', mixedAttachments, PROBLEM_PHOTO_ATTACHMENT.url],
  ])('resolves the problem photo, given %s', async (_name, payload, key) => {
    expect((await detailFrom(payload)).photoUrl).toBe(resolveAttachmentUrl(key));
  });

  // Nothing to resolve, so the designed empty state is still the right answer.
  it.each([
    ['no attachments', noAttachments],
    ['a voice note only', voiceOnlyAttachments],
  ])('reports no photo at all, given %s', async (_name, payload) => {
    expect((await detailFrom(payload)).photoUrl).toBeUndefined();
  });

  // The builder is asserted on its own, so a change to the gate cannot hide a change to it.
  it('builds that url from the storage endpoint and the key', () => {
    expect(resolveAttachmentUrl(PROBLEM_PHOTO_ATTACHMENT.url)).toBe(
      `${API_BASE_URLS.media}/Storage?objectName=reportimage%2Ff8086949.jpg`,
    );
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
  // Dropped rather than parsed: a consumer handed nothing cannot misuse a string coordinate.
  it.each([
    ['as strings', withAnalysis],
    ['as empty strings', coordsEmpty],
    ['as null', coordsNull],
  ])('drops the coordinates sent %s', async (_name, payload) => {
    const detail = await detailFrom(payload);

    expect(detail).not.toHaveProperty('latitude');
    expect(detail).not.toHaveProperty('longitude');
  });

  // No coordinate string escapes in any field at any depth, so a later field cannot smuggle one.
  it('lets no string coordinate escape anywhere in the mapped detail', async () => {
    const strings = everyString(await detailFrom(probeCaseReview));

    expect(strings).not.toContain(PROBE_LATITUDE);
    expect(strings).not.toContain(PROBE_LONGITUDE);
    // The sweep is only meaningful if it is reading something: the title proves it walked.
    expect(strings).toContain('انسداد في قناة الري');
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
