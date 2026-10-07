import {
  analyzeResponse,
  CREATES_NOTHING,
  CREATES_AN_ISSUE,
} from '@/__fixtures__/wire/analyze';
import {
  appointmentAlwaysNull,
  EVERY_STATUS_CODE,
  everyStatusCode,
  farmerIssueRow,
  noExpert,
  REPORTER_ID,
  twoRowsNaiveTimestamps,
  unknownStatusCode,
  withAppointment,
} from '@/__fixtures__/wire/farmerIssues';
import { API_BASE_URLS } from '@/config/env';

import { analyzeIssue, createIssue, getMyReports, getReportById } from '../reportService';
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

/** A blank row renders as nothing rather than as an error, so this class never shows on a device. */
function brokenValues(mapped: object): string[] {
  return Object.entries(mapped)
    .filter(([, value]) => Number.isNaN(value) || value === 'undefined' || value === 'null')
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

describe('GET /Farmer/issues/{reporterId}', () => {
  // The service authorises against the query value and ignores the route segment - §4.3, F2.
  it('spells the reporter guid in the path and in the query string', async () => {
    mockGet.mockResolvedValue([]);

    await getMyReports();

    expect(mockGet).toHaveBeenCalledWith(
      API_BASE_URLS.issue,
      `/Farmer/issues/${REPORTER_ID}?ReporterId=${REPORTER_ID}`,
      { authenticated: true },
    );
  });

  // Sending undefined would collect an Unauthorized and read on screen as a session problem.
  it('refuses to call the server with no reporter id', async () => {
    mockGetTokenUserId.mockResolvedValue(null);

    await expect(getMyReports()).rejects.toThrow(/ReporterId/);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('maps a row onto a Report', async () => {
    mockGet.mockResolvedValue(withAppointment);

    const [report] = await getMyReports();

    expect(report).toEqual({
      id: 'i-1',
      title: 'تسريب في الأنبوب',
      description: 'ماء على السطح',
      status: 'Assigned',
      createdAt: '2026-10-05T19:47:30Z',
      reporterId: REPORTER_ID,
      attachments: [],
    });
  });
});

// `status` is an int: no JsonStringEnumConverter is registered anywhere in the solution.
describe('IssueStatus as the int it is', () => {
  const EXPECTED = [
    'Reported',
    'Diagnosed',
    'Assigned',
    'Reviewed',
    'Scheduled',
    'Repaired',
    'completed',
  ];

  it('names every code the enum can send', async () => {
    mockGet.mockResolvedValue(everyStatusCode);

    const reports = await getMyReports();

    expect(EVERY_STATUS_CODE).toHaveLength(EXPECTED.length);
    expect(reports.map(report => report.status).sort()).toEqual([...EXPECTED].sort());
  });

  // Falls back rather than throwing: the server can grow the enum before this build does.
  it('falls back on a code this build does not know', async () => {
    mockGet.mockResolvedValue(unknownStatusCode);

    expect((await getMyReports())[0].status).toBe('Reported');
  });
});

describe('what the row carries and بلاغاتي throws away', () => {
  // All real data. F-06 is still served by the mock, so the mapper deliberately drops it.
  it('drops the whole appointment, the expert and the team', async () => {
    mockGet.mockResolvedValue(withAppointment);

    const [report] = await getMyReports();

    (['slotStart', 'slotEnd', 'sceduleDate', 'expertName', 'expertId', 'teamName'] as const).forEach(
      field => expect(report).not.toHaveProperty(field),
    );
  });

  // F6: GetFarmerIssuesSpecs never includes RepairSchedule, so in practice all three are null.
  it('maps a row whose appointment fields are null, which is every row today', async () => {
    mockGet.mockResolvedValue(appointmentAlwaysNull);

    expect((await getMyReports())[0].id).toBe('i-1');
  });

  // Before ExpertAssignmentJob has run, and F1 is the cast that trips over exactly this row.
  it('maps a row with no expert assigned yet', async () => {
    mockGet.mockResolvedValue(noExpert);

    const [report] = await getMyReports();

    expect(report).toMatchObject({ id: 'i-unassigned', status: 'Reported' });
  });

  // BACKEND-GAP G9/F21/F22: the row has no priority, no attachment and no analysis.
  it('invents neither a severity nor a photo', async () => {
    mockGet.mockResolvedValue(withAppointment);

    const [report] = await getMyReports();

    expect(report.analysis).toBeUndefined();
    expect(report.attachments).toEqual([]);
  });

  it('puts no NaN and no stringified null on a mapped row', async () => {
    mockGet.mockResolvedValue(everyStatusCode);

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

/**
 * §4.1 creates an issue only for a severity that maps to Medium or above, so the server's rows
 * and the mirror's rows are disjoint sets and the concatenation needs no matching.
 */
describe('createIssue to getMyReports to getReportById', () => {
  it.each(CREATES_NOTHING)('lists a %s report, which the backend never created', async severity => {
    mockGet.mockResolvedValue([]);

    const filed = await fileReport(severity);

    await expect(getMyReports()).resolves.toMatchObject([{ id: filed.id }]);
    // The local half carries the diagnosis and the photo, which no server row ever does.
    await expect(getReportById(filed.id)).resolves.toMatchObject({
      id: filed.id,
      status: 'Diagnosed',
      analysis: { severity },
    });
  });

  it.each(CREATES_AN_ISSUE)('hides a %s report, because the server is creating one', async severity => {
    mockGet.mockResolvedValue([]);

    const filed = await fileReport(severity);

    await expect(getMyReports()).resolves.toEqual([]);
    // Still addressable by the local id: creation is async and the response carries none.
    await expect(getReportById(filed.id)).resolves.toMatchObject({ id: filed.id });
  });

  it('folds the percentage confidence once, at the analyze boundary', async () => {
    const filed = await fileReport('حرجة جداً');

    expect(filed.analysis?.confidence).toBeCloseTo(0.9598);
  });

  // The whole invariant: a Medium+ report exists on both sides and must still be listed once.
  it('shows one row when the server row and the mirror row coexist', async () => {
    mockGet.mockResolvedValue(withAppointment);

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

// BACKEND-GAP G9/F12: there is no GET /Farmer/issues/{issueId}. The route that looks like one
// is the list, filtered on the query string, so one issue has no endpoint of its own.
describe('getReportById', () => {
  it('answers from the mirror without calling the server', async () => {
    const filed = await fileReport('بسيطة');

    await expect(getReportById(filed.id)).resolves.toMatchObject({ id: filed.id });
    expect(mockGet).not.toHaveBeenCalled();
  });

  // Two ids address one Medium+ report, and they cannot be reconciled - no id comes back.
  it('finds a server guid in the list, with no analysis and no photo', async () => {
    mockGet.mockResolvedValue(withAppointment);

    const report = await getReportById('i-1');

    expect(report.status).toBe('Assigned');
    expect(report.analysis).toBeUndefined();
    expect(report.attachments).toEqual([]);
  });

  it('throws when neither half holds it', async () => {
    mockGet.mockResolvedValue(withAppointment);

    await expect(getReportById('someone-elses')).rejects.toThrow(/someone-elses/);
  });
});
