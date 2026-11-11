import {
  analyzeResponse,
  CREATES_NOTHING,
  CREATES_AN_ISSUE,
} from '@/__fixtures__/wire/analyze';
import {
  EVERY_STATUS_CODE,
  EVERY_STATUS_NAME,
  everyStatusCode,
  everyStatusName,
  expertAlwaysEmpty,
  farmerIssueRow,
  farmerIssuesPage,
  hiddenByDefaultPredicate,
  noAppointmentFields,
  noExpert,
  noPhoto,
  REPORTER_ID,
  twoRowsNaiveTimestamps,
  unknownStatusCode,
  unknownStatusName,
} from '@/__fixtures__/wire/farmerIssues';
import { ApiError } from '@/api/errors';
import { API_BASE_URLS } from '@/config/env';

import {
  analyzeIssue,
  createIssue,
  farmerIssueRows,
  getMyReports,
  getReportById,
  resolveAttachmentUrl,
} from '../reportService';
import { resetReportMirror } from '../reportStore';

import type { Report } from '../../types';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockGetTokenUserId = jest.fn<Promise<string | null>, []>();

jest.mock('@/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
  getTokenUserId: () => mockGetTokenUserId(),
}));

// jest.setup's stub never returns what it stored, and the mirror is half the read path here.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
      setItem: (key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        store.delete(key);
        return Promise.resolve();
      },
    },
  };
});

/** The object key every default `farmerIssueRow` carries, which PROBE row C2 really returned. */
const DEFAULT_ROW_PHOTO_KEY = 'issues/360f5be4-c647-480b-ab7b-73fd76495993.jpg';

/** A blank row renders as nothing rather than as an error, so this class never shows on a device. */
function brokenValues(mapped: object): string[] {
  return Object.entries(mapped)
    .filter(
      ([, value]) => Number.isNaN(value) || value === 'undefined' || value === 'null',
    )
    .map(([key]) => key);
}

/** The analyze response, then the local half of filing - one network call, as of 3 October. */
async function fileReport(severity: string): Promise<Report> {
  mockPost.mockResolvedValue(analyzeResponse({ severity }));
  const analysis = await analyzeIssue({ uri: 'file:///cache/photo.jpg' });
  return createIssue({ analysis, description: 'ماء على السطح' });
}

beforeEach(async () => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockGetTokenUserId.mockReset();
  mockGetTokenUserId.mockResolvedValue(REPORTER_ID);
  await resetReportMirror();
});

describe('GET /Farmer/issues/{reporterId} - the query shape (R1)', () => {
  // PROBE C2 returned 6 rows where the bare call returned 4 and the unknown fallback 3.
  it('blanks all three filters, keeping the backend misspelling of Assigend', async () => {
    mockGet.mockResolvedValue([]);

    await getMyReports();

    expect(mockGet).toHaveBeenCalledWith(
      API_BASE_URLS.issue,
      `/Farmer/issues/${REPORTER_ID}?Completed=&Critical=&Assigend=`,
      { authenticated: true },
    );
  });

  // C3: ?Critical=unknown narrows the clause instead of nulling it, so it must never be sent.
  it('sends no value for any of the three filters, and never the unknown fallback', async () => {
    mockGet.mockResolvedValue([]);

    await getMyReports();

    const [, path] = mockGet.mock.calls[0];
    expect(path).not.toMatch(/unknown/);
    expect(path).not.toMatch(/ReporterId=/);
    expect(path).toMatch(/\?Completed=&Critical=&Assigend=$/);
  });

  // Sending undefined would collect an Unauthorized and read on screen as a session problem.
  it('refuses to call the server with no reporter id', async () => {
    mockGetTokenUserId.mockResolvedValue(null);

    await expect(getMyReports()).rejects.toThrow(/ReporterId/);
    expect(mockGet).not.toHaveBeenCalled();
  });

  // attachments is empty although the row carries a key: STORAGE_SERVES_BYTES gates it.
  it('maps a row onto a Report', async () => {
    mockGet.mockResolvedValue(noAppointmentFields);

    const [report] = await getMyReports();

    expect(report).toEqual({
      id: 'i-1',
      title: 'تسريب في الأنبوب',
      description: 'ماء على السطح',
      // `priority`, mapped: the only severity this row has, and what paints its 4px top border.
      severity: 'حرجة',
      status: 'Assigned',
      createdAt: '2026-10-05T19:47:30Z',
      reporterId: REPORTER_ID,
      attachments: [
        {
          id: 'i-1-photo',
          type: 'Photo',
          url: resolveAttachmentUrl(DEFAULT_ROW_PHOTO_KEY),
          createdAt: '2026-10-05T19:47:30Z',
        },
      ],
    });
  });

  // Both rows are Repaired and Medium, which the default predicate matches neither of.
  it('lists the Repaired non-critical rows the default predicate hides', async () => {
    mockGet.mockResolvedValue(hiddenByDefaultPredicate);

    const reports = await getMyReports();

    expect(reports).toHaveLength(2);
    expect(reports.every(report => report.status === 'Repaired')).toBe(true);
  });
});

// Every object is zero bytes, so the device's own file plus analyze's key is the only photo.
describe('the photo بلاغاتي can draw', () => {
  const KEY = 'issues/8d1f-pipe.jpg';
  const LOCAL = 'file:///cache/pipe.jpg';

  async function analyzeOnThisDevice(): Promise<void> {
    mockPost.mockResolvedValue(analyzeResponse({ filePath: KEY }));
    await analyzeIssue({ uri: LOCAL });
  }

  it('draws the local file for a row whose key this device uploaded', async () => {
    await analyzeOnThisDevice();
    mockGet.mockResolvedValue([
      farmerIssueRow({ issueId: 'i-mine', imageUrl: undefined, imageurl: KEY }),
    ]);

    const [report] = await getMyReports();

    expect(report.attachments).toEqual([
      expect.objectContaining({ type: 'Photo', url: LOCAL }),
    ]);
  });

  // Storage serves bytes, so a key this device never uploaded still resolves to a drawable url.
  it('draws the storage url for a row whose key only the server knows', async () => {
    await analyzeOnThisDevice();
    mockGet.mockResolvedValue([
      farmerIssueRow({
        issueId: 'i-theirs',
        imageUrl: undefined,
        imageurl: 'issues/other.jpg',
      }),
    ]);

    const [report] = await getMyReports();

    expect(report.attachments).toEqual([
      expect.objectContaining({
        type: 'Photo',
        url: resolveAttachmentUrl('issues/other.jpg'),
      }),
    ]);
  });

  // The index is keyed, not positional: a second report must not inherit the first one's photo.
  it("keeps one report's photo off another report's row", async () => {
    await analyzeOnThisDevice();
    mockGet.mockResolvedValue([
      farmerIssueRow({ issueId: 'i-mine', imageUrl: undefined, imageurl: KEY }),
      farmerIssueRow({
        issueId: 'i-other',
        imageUrl: undefined,
        imageurl: 'issues/zzz.jpg',
      }),
    ]);

    const [first, second] = await getMyReports();

    expect(first.attachments[0]).toMatchObject({ url: LOCAL });
    expect(second.attachments[0]).toMatchObject({
      url: resolveAttachmentUrl('issues/zzz.jpg'),
    });
  });
});

// Both shapes are asserted: a bare array, and the PaginatedResult envelope 92b621c returns.
describe('the list arrives bare or inside PaginatedResult', () => {
  it('reads the rows out of the results envelope', async () => {
    mockGet.mockResolvedValue(farmerIssuesPage(everyStatusName));

    const reports = await getMyReports();

    expect(reports).toHaveLength(EVERY_STATUS_NAME.length);
    expect(reports.map(report => report.id).sort()).toEqual(
      EVERY_STATUS_NAME.map(status => `i-${status}`).sort(),
    );
  });

  it('still reads a bare array, which is what the older deployment answers', async () => {
    mockGet.mockResolvedValue(everyStatusName);

    expect(await getMyReports()).toHaveLength(EVERY_STATUS_NAME.length);
  });

  it('reads an empty envelope as an empty list, not as a failure', async () => {
    mockGet.mockResolvedValue(farmerIssuesPage([]));

    expect(await getMyReports()).toEqual([]);
  });

  // A third shape is unreadable: an error says so, where an empty list would deny they exist.
  it('rejects on a body that is neither, rather than emptying the list', async () => {
    mockGet.mockResolvedValue({ pageIndex: 1, totalCount: 7 });

    await expect(getMyReports()).rejects.toThrow(
      /neither an array nor a results envelope/,
    );
  });

  it('unwraps the two shapes to the same rows', () => {
    const rows = farmerIssueRows(everyStatusName);

    expect(farmerIssueRows(farmerIssuesPage(everyStatusName))).toEqual(rows);
  });
});

// B1: an empty list and a failed read look identical unless the service throws.
describe('a refused list is an error state, never an empty one', () => {
  it('rejects on a 404 rather than resolving to an empty list', async () => {
    mockGet.mockRejectedValue(
      ApiError.fromResponse(404, { method: 'GET', url: '/Farmer/issues' }),
    );

    await expect(getMyReports()).rejects.toBeInstanceOf(ApiError);
  });

  // Shape A, the only structured refusal IssueService was observed to send (PROBE C10).
  it('rejects on the ISSUE_NOT_FOUND envelope', async () => {
    mockGet.mockRejectedValue(
      ApiError.fromResponse(404, {
        method: 'GET',
        url: '/Farmer/issues',
        code: 'ISSUE_NOT_FOUND',
        serverMessage: 'Issue not found.',
      }),
    );

    await expect(getMyReports()).rejects.toMatchObject({ code: 'ISSUE_NOT_FOUND' });
  });

  it('rejects on a network failure rather than falling back to the mirror', async () => {
    await fileReport('بسيطة');
    mockGet.mockRejectedValue(ApiError.network({ method: 'GET', url: '/Farmer/issues' }));

    // Half a list presented as the whole one is worse than an error with a retry.
    await expect(getMyReports()).rejects.toMatchObject({ isNetworkError: true });
  });
});

// B2: both vocabularies are asserted, so a drift back fails here rather than on a device.
describe('IssueStatus over both wire vocabularies (R2/D4)', () => {
  const EXPECTED = [...EVERY_STATUS_NAME];

  it('reads every status the deployment sends today, as a name', async () => {
    mockGet.mockResolvedValue(everyStatusName);

    const reports = await getMyReports();

    expect(EVERY_STATUS_NAME).toHaveLength(EXPECTED.length);
    expect(reports.map(report => report.status).sort()).toEqual([...EXPECTED].sort());
  });

  it('still reads every status as the integer it used to be', async () => {
    mockGet.mockResolvedValue(everyStatusCode);

    const reports = await getMyReports();

    expect(EVERY_STATUS_CODE).toHaveLength(EXPECTED.length);
    expect(reports.map(report => report.status).sort()).toEqual([...EXPECTED].sort());
  });

  // Falls back rather than throwing: a mapper that throws takes out the screen over one row.
  it('falls back to Reported on a code this build does not know', async () => {
    mockGet.mockResolvedValue(unknownStatusCode);

    expect((await getMyReports())[0].status).toBe('Reported');
  });

  it('falls back to Reported on a NAME this build does not know', async () => {
    mockGet.mockResolvedValue(unknownStatusName);

    expect((await getMyReports())[0].status).toBe('Reported');
  });
});

describe('what the row cannot carry, as opposed to what it withholds', () => {
  // G13: these four are absent from the thirteen fields, so there is nothing here to drop.
  it('maps a row that carries no appointment fields at all', async () => {
    mockGet.mockResolvedValue(noAppointmentFields);

    const [report] = await getMyReports();

    (['slotStart', 'slotEnd', 'sceduleDate', 'teamName'] as const).forEach(field =>
      expect(report).not.toHaveProperty(field),
    );
    expect(report.id).toBe('i-1');
  });

  // G12: the three expert fields are present and permanently empty, so nothing may render them.
  it('puts no expert on a row whose issue has one, because the row cannot say so', async () => {
    mockGet.mockResolvedValue(expertAlwaysEmpty);

    const [report] = await getMyReports();

    (['expertName', 'expertUrl', 'expertId'] as const).forEach(field =>
      expect(report).not.toHaveProperty(field),
    );
  });

  // Before the assignment job has run, and F1 is the cast that trips over exactly this row.
  it('maps a row with no expert assigned yet', async () => {
    mockGet.mockResolvedValue(noExpert);

    const [report] = await getMyReports();

    expect(report).toMatchObject({ id: 'i-unassigned', status: 'Reported' });
  });

  // priority is deliberately unmapped: a Report carries severity only inside analysis.
  it('invents neither a severity nor a photo', async () => {
    mockGet.mockResolvedValue(noPhoto);

    const [report] = await getMyReports();

    expect(report.analysis).toBeUndefined();
    expect(report.attachments).toEqual([]);
  });

  it('puts no NaN and no stringified null on a mapped row', async () => {
    mockGet.mockResolvedValue(everyStatusName);

    (await getMyReports()).forEach(report => expect(brokenValues(report)).toEqual([]));
  });
});

// `datetime2` holds no offset, so the sort is the difference between today and yesterday.
describe('the naive timestamps the sort depends on', () => {
  it('marks both rows as UTC and orders them newest first', async () => {
    mockGet.mockResolvedValue(twoRowsNaiveTimestamps);

    const reports = await getMyReports();

    expect(reports.map(report => report.id)).toEqual(['server-new', 'server-old']);
    expect(reports[0].createdAt).toBe('2026-10-05T12:45:58.0923551Z');
  });
});

// Server rows and mirror rows are disjoint sets, so the concatenation needs no matching.
describe('createIssue to getMyReports to getReportById', () => {
  it.each(CREATES_NOTHING)(
    'lists a %s report, which the backend never created',
    async severity => {
      mockGet.mockResolvedValue([]);

      const filed = await fileReport(severity);

      await expect(getMyReports()).resolves.toMatchObject([{ id: filed.id }]);
      // The local half carries the diagnosis and the photo, which no server row ever does.
      await expect(getReportById(filed.id)).resolves.toMatchObject({
        id: filed.id,
        status: 'Diagnosed',
        analysis: { severity },
      });
    },
  );

  it.each(CREATES_AN_ISSUE)(
    'hides a %s report, because the server is creating one',
    async severity => {
      mockGet.mockResolvedValue([]);

      const filed = await fileReport(severity);

      await expect(getMyReports()).resolves.toEqual([]);
      // Still addressable by the local id: creation is async and the response carries none.
      await expect(getReportById(filed.id)).resolves.toMatchObject({ id: filed.id });
    },
  );

  it('folds the percentage confidence once, at the analyze boundary', async () => {
    const filed = await fileReport('حرجة جداً');

    expect(filed.analysis?.confidence).toBeCloseTo(0.9598);
  });

  // The whole invariant: a Medium+ report exists on both sides and must still be listed once.
  it('shows one row when the server row and the mirror row coexist', async () => {
    mockGet.mockResolvedValue(noAppointmentFields);

    await fileReport('عالية');
    const reports = await getMyReports();

    expect(reports).toHaveLength(1);
    expect(reports[0].id).toBe('i-1');
  });

  // The deletion condition, stated as a test: fix F23 and this becomes two rows for one report.
  it('would duplicate the moment the backend starts creating Low-severity issues', async () => {
    const filed = await fileReport('بسيطة');
    mockGet.mockResolvedValue([farmerIssueRow({ issueId: 'i-low', title: filed.title })]);

    const reports = await getMyReports();

    expect(reports).toHaveLength(2);
    expect(reports.map(report => report.title)).toEqual([filed.title, filed.title]);
  });
});

// G9/F12: there is no GET /Farmer/issues/{issueId}; the lookalike route is the list.
describe('getReportById', () => {
  it('answers from the mirror without calling the server', async () => {
    const filed = await fileReport('بسيطة');

    await expect(getReportById(filed.id)).resolves.toMatchObject({ id: filed.id });
    expect(mockGet).not.toHaveBeenCalled();
  });

  // Two ids address one Medium+ report, and they cannot be reconciled - no id comes back.
  it('finds a server guid in the list, with no analysis', async () => {
    mockGet.mockResolvedValue(noAppointmentFields);

    const report = await getReportById('i-1');

    expect(report.status).toBe('Assigned');
    expect(report.analysis).toBeUndefined();
  });

  it('throws when neither half holds it', async () => {
    mockGet.mockResolvedValue(noAppointmentFields);

    await expect(getReportById('someone-elses')).rejects.toThrow(/someone-elses/);
  });
});
