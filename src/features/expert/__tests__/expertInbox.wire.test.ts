import {
  everyNullableNull,
  noAnalysis,
  unknownSeverity,
  withAnalysis,
} from '@/__fixtures__/wire/caseReview';
import {
  CAPPED_TOTAL,
  cappedPage,
  everyStatusPage,
  EVERY_WIRE_STATUS,
  fullPage,
  naiveCreatedAtPage,
  nullFieldsPage,
  pagedTotal,
  priorityAsFourPage,
  RELATIVE_NOW,
  shortPage,
  statusPage,
} from '@/__fixtures__/wire/expertInbox';
import { API_BASE_URLS } from '@/config/env';
import { formatRelativeTime } from '@/features/reports/relativeTime';

import { getAssignedCases } from '../services/expertService';

import type { ExpertCaseSummary } from '../types';

const mockGet = jest.fn();

jest.mock('@/api', () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args) },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
  ApiError: jest.requireActual('@/api/errors').ApiError,
  getTokenUserId: jest.fn(),
}));

const INBOX_PATH = /^\/Expert\/inbox\?/;
const DETAIL_PATH = /^\/Expert\/([^/]+)\/review$/;
const PAGE_INDEX = /pageIndex=(\d+)/;

type Handlers = {
  page: (pageIndex: number) => Promise<unknown>;
  detail?: (id: string) => Promise<unknown>;
};

/** One mock for both calls getAssignedCases makes, routed on the path it was handed. */
function serve({ page, detail }: Handlers): void {
  mockGet.mockImplementation((_base: string, path: string) => {
    const match = DETAIL_PATH.exec(path);
    if (match) {
      return detail ? detail(match[1]) : Promise.reject(new Error(`no detail for ${match[1]}`));
    }
    return page(Number(PAGE_INDEX.exec(path)?.[1] ?? '1'));
  });
}

function pathsMatching(pattern: RegExp): string[] {
  return mockGet.mock.calls.map(call => String(call[1])).filter(path => pattern.test(path));
}

/** A blank card renders as nothing rather than as an error, so this class never shows on a device. */
function brokenValues(mapped: object): string[] {
  return Object.entries(mapped)
    .filter(([, value]) => Number.isNaN(value) || value === 'undefined' || value === 'null')
    .map(([key]) => key);
}

beforeEach(() => mockGet.mockReset());

describe('getAssignedCases against GET /Expert/inbox', () => {
  it('maps a full page of ten and fans out one detail call per row', async () => {
    serve({ page: () => Promise.resolve(fullPage), detail: () => Promise.resolve(withAnalysis) });

    const cases = await getAssignedCases();

    expect(cases).toHaveLength(10);
    expect(pathsMatching(INBOX_PATH)).toHaveLength(1);
    expect(pathsMatching(DETAIL_PATH)).toHaveLength(10);
  });

  // totalCount is satisfied by the first page, so a second call would be a wasted round trip.
  it('stops after one call when a short page already covers totalCount', async () => {
    serve({ page: () => Promise.resolve(shortPage), detail: () => Promise.resolve(withAnalysis) });

    expect(await getAssignedCases()).toHaveLength(3);
    expect(pathsMatching(INBOX_PATH)).toHaveLength(1);
  });

  // Paged off totalCount only: pageCount is the item count on this page - §4.2 note 3, F33.
  it('pages until the rows reach totalCount, keeping wire order', async () => {
    serve({
      page: index => Promise.resolve(pagedTotal[index - 1]),
      detail: () => Promise.resolve(withAnalysis),
    });

    const cases = await getAssignedCases();

    expect(pathsMatching(INBOX_PATH)).toHaveLength(3);
    expect(cases.map(summary => summary.reportId)).toEqual(
      Array.from({ length: 23 }, (_, index) => `issue-${index + 1}`),
    );
  });

  // Lowercase `pageIndex`, and PageSize at the top of the server's [5, 10] clamp.
  it('sends the query string IssueQueryParameters binds', async () => {
    serve({ page: () => Promise.resolve(shortPage), detail: () => Promise.resolve(withAnalysis) });

    await getAssignedCases();

    expect(mockGet).toHaveBeenNthCalledWith(
      1,
      API_BASE_URLS.issue,
      '/Expert/inbox?PageSize=10&pageIndex=1&SortingOptions=2',
      { authenticated: true },
    );
  });

  // The cap is the only thing between a long-serving expert and 200 sequential requests.
  it('stops at five pages however much the server says it holds', async () => {
    serve({
      page: index => Promise.resolve(cappedPage(index)),
      detail: () => Promise.resolve(withAnalysis),
    });

    const cases = await getAssignedCases();

    expect(CAPPED_TOTAL).toBe(200);
    expect(pathsMatching(INBOX_PATH)).toHaveLength(5);
    expect(cases).toHaveLength(50);
  });
});

describe('every IssueStatus the inbox can send', () => {
  /** §3's seven values onto the lifecycle status and the five facts, with no review on record. */
  const EXPECTED: Record<string, [string, boolean, boolean, boolean, boolean]> = {
    Reported: ['New', false, false, false, false],
    Diagnosed: ['New', true, false, false, false],
    Assigned: ['UnderReview', true, false, false, false],
    Reviewed: ['UnderReview', true, true, false, false],
    Scheduled: ['Scheduled', true, true, true, false],
    Repaired: ['Scheduled', true, true, true, true],
    completed: ['Resolved', true, true, true, true],
  };

  it.each(EVERY_WIRE_STATUS)('places a %s row', async status => {
    const [lifecycle, hasAiAnalysis, hasExpertReview, hasAppointment, hasRepairConfirmation] =
      EXPECTED[status];
    serve({
      page: () => Promise.resolve(statusPage(status)),
      detail: () => Promise.resolve(withAnalysis),
    });

    const [card] = await getAssignedCases();

    expect(card).toMatchObject({
      status: lifecycle,
      hasAiAnalysis,
      hasExpertReview,
      hasAppointment,
      hasRepairConfirmation,
    });
  });

  // The wire string is lowercase - `.ToString()` on the C# source emits "completed".
  it('reads the lowercase completed as the only resolved status', async () => {
    serve({
      page: () => Promise.resolve(statusPage('completed')),
      detail: () => Promise.resolve(withAnalysis),
    });

    expect((await getAssignedCases())[0].status).toBe('Resolved');
  });
});

describe('the shapes the row really arrives in', () => {
  // Correct for a priority, but غير معروفة on a real card is the §6 G11/F7 enum shift showing.
  it('reads priority "4" as the unknown severity, and does not warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      serve({
        page: () => Promise.resolve(priorityAsFourPage),
        detail: () => Promise.resolve(noAnalysis),
      });

      expect((await getAssignedCases())[0].severity).toBe('غير معروفة');
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  // SeverityLevel is the vision service's own list and may grow an eleventh value.
  it('passes a severity outside the ten known values through untouched', async () => {
    serve({
      page: () => Promise.resolve(shortPage),
      detail: () => Promise.resolve(unknownSeverity),
    });

    const cases = await getAssignedCases();

    expect(cases.map(summary => summary.severity)).toEqual(Array(3).fill('شديدة الخطورة'));
  });

  it('maps a row whose description and assignedExpertId are null', async () => {
    serve({
      page: () => Promise.resolve(nullFieldsPage),
      detail: () => Promise.resolve(withAnalysis),
    });

    expect((await getAssignedCases())[0].title).toBe('تسريب في الأنبوب');
  });

  // Skipping the Z shifts every card by the device's offset, which near midnight is a day.
  it('marks the naive createdAt as UTC, and the relative time follows', async () => {
    serve({
      page: () => Promise.resolve(naiveCreatedAtPage),
      detail: () => Promise.resolve(withAnalysis),
    });

    const [card] = await getAssignedCases();

    expect(card.createdAt).toBe('2026-10-05T19:47:30Z');
    expect(formatRelativeTime(card.createdAt, RELATIVE_NOW)).toBe('منذ 8 ساعات');
    // What the expert would read instead, on every phone that is not on UTC.
    if (RELATIVE_NOW.getTimezoneOffset() !== 0) {
      expect(formatRelativeTime('2026-10-05T19:47:30', RELATIVE_NOW)).not.toBe('منذ 8 ساعات');
    }
  });

  // Failing toward "trust this less": zero confidence is the amber chip that says look yourself.
  it('degrades a row whose detail call failed rather than dropping it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      serve({
        page: () => Promise.resolve(shortPage),
        detail: () => Promise.reject(new Error('refused')),
      });

      const cases = await getAssignedCases();

      expect(cases).toHaveLength(3);
      cases.forEach(card => {
        expect(card.confidence).toBe(0);
        expect(card.severity).toBe('عالية');
        expect(card.photoUrl).toBeUndefined();
      });
      // One line per load, not one per failure: an unreachable server would write fifty.
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  // G5 and G7: no corroboration count and no user lookup exist, so neither is invented.
  it('names no reporter and claims no corroboration', async () => {
    serve({ page: () => Promise.resolve(shortPage), detail: () => Promise.resolve(withAnalysis) });

    const [card] = await getAssignedCases();

    expect(card.reporterName).toBe('مزارع');
    expect(card.corroborationCount).toBe(0);
    expect(card.reporterAvatar).toBeUndefined();
  });

  it('puts no NaN and no stringified null on any card', async () => {
    serve({
      page: () => Promise.resolve(everyStatusPage),
      detail: () => Promise.resolve(everyNullableNull),
    });

    const cases: ExpertCaseSummary[] = await getAssignedCases();

    expect(cases).toHaveLength(EVERY_WIRE_STATUS.length);
    cases.forEach(card => expect(brokenValues(card)).toEqual([]));
  });
});
