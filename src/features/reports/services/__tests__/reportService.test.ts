import { API_BASE_URLS } from '@/config/env';

import {
  analyzeIssue,
  buildAnalyzeFormData,
  createIssue,
  describeStatus,
  getMyReports,
  getReportById,
  normalizeConfidence,
  resolveAttachmentUrl,
  toUtcTimestamp,
} from '../reportService';
import { resetReportMirror, saveMirroredReport } from '../reportStore';

import type { GetFarmerIssuesWire } from '../../types';

const mockPost = jest.fn();
const mockGet = jest.fn();
const mockGetTokenUserId = jest.fn<Promise<string | null>, []>();

jest.mock('@/api', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
  getTokenUserId: () => mockGetTokenUserId(),
}));

// jest.setup's stub never returns what it stored, and the mirror is the read path here.
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

// Pins what makes the fold safe: a value already in range must come back untouched.
describe('normalizeConfidence', () => {
  it('leaves a fractional confidence untouched', () => {
    expect(normalizeConfidence(0.91)).toBe(0.91);
    expect(normalizeConfidence(0.62)).toBe(0.62);
    expect(normalizeConfidence(1)).toBe(1);
  });

  it('folds a percentage into the same range', () => {
    expect(normalizeConfidence(91)).toBeCloseTo(0.91);
    expect(normalizeConfidence(62)).toBeCloseTo(0.62);
    expect(normalizeConfidence(100)).toBe(1);
  });

  it('clamps above 100 rather than reporting more than certainty', () => {
    expect(normalizeConfidence(140)).toBe(1);
  });

  it('treats missing or nonsensical values as no confidence', () => {
    expect(normalizeConfidence(0)).toBe(0);
    expect(normalizeConfidence(-5)).toBe(0);
    expect(normalizeConfidence(NaN)).toBe(0);
    expect(normalizeConfidence(Infinity)).toBe(0);
  });
});

// Both inputs are real values this backend has served, a day apart.
describe('resolveAttachmentUrl', () => {
  const EXPECTED = `${API_BASE_URLS.media}/storage?objectName=reportimage%2Fabc-123.jpg`;

  it('points a bare object key at the storage endpoint', () => {
    expect(resolveAttachmentUrl('reportimage/abc-123.jpg')).toBe(EXPECTED);
  });

  it('recovers the key from the doubled MinIO URL the server builds', () => {
    // 127.0.0.1 is the phone, the bucket segment is doubled, and the bucket is private.
    expect(
      resolveAttachmentUrl('http://127.0.0.1:9000/reportimage/reportimage/abc-123.jpg'),
    ).toBe(EXPECTED);
  });

  it('also handles the URL the server would build if it stopped doubling', () => {
    expect(resolveAttachmentUrl('http://192.168.1.29:9000/reportimage/abc-123.jpg')).toBe(
      EXPECTED,
    );
  });

  // Media.Grpc's UploadMedia answers with the object key alone, under the `issues` folder.
  it('points the gRPC upload\'s bare key at the storage endpoint too', () => {
    expect(resolveAttachmentUrl('issues/8d1f-photo.jpg')).toBe(
      `${API_BASE_URLS.media}/storage?objectName=issues%2F8d1f-photo.jpg`,
    );
  });

  it('leaves anything that is not a stored photo alone', () => {
    // The mock's seeds and a local capture, neither of which is in MinIO.
    const picsum = 'https://picsum.photos/seed/wahakun-canal/900/675';
    expect(resolveAttachmentUrl(picsum)).toBe(picsum);
    expect(resolveAttachmentUrl('file:///cache/report.jpg')).toBe(
      'file:///cache/report.jpg',
    );
  });
});

// `datetime2` holds no offset, so a UTC instant arrives looking like a local one.
describe('toUtcTimestamp', () => {
  it('marks a bare server timestamp as UTC', () => {
    expect(toUtcTimestamp('2026-08-09T13:01:13.4206342')).toBe(
      '2026-08-09T13:01:13.4206342Z',
    );
    expect(toUtcTimestamp('2026-08-09T13:01:13')).toBe('2026-08-09T13:01:13Z');
    expect(toUtcTimestamp('2026-08-09T13:01')).toBe('2026-08-09T13:01Z');
  });

  it('leaves a timestamp that already says what it is', () => {
    expect(toUtcTimestamp('2026-08-09T13:01:13.42Z')).toBe('2026-08-09T13:01:13.42Z');
    expect(toUtcTimestamp('2026-08-09T16:01:13+03:00')).toBe('2026-08-09T16:01:13+03:00');
  });

  it('leaves anything that is not a date-time alone', () => {
    // What the server sends for an attachment's createdAt.
    expect(toUtcTimestamp('')).toBe('');
    expect(toUtcTimestamp('2026-08-09')).toBe('2026-08-09');
  });
});

// IssueStatus crosses the wire as an int, and a wrong mapping is invisible to the compiler.
// The table below is complete: every value of §3's enum, 0 through 6. 2 and 3 used to be
// missing from it and were also wrong in the map - do not skip them again.
describe('describeStatus', () => {
  it('names every IssueStatus the server can send', () => {
    expect(describeStatus(0)).toBe('Reported');
    expect(describeStatus(1)).toBe('Diagnosed');
    expect(describeStatus(2)).toBe('Assigned');
    expect(describeStatus(3)).toBe('Reviewed');
    expect(describeStatus(4)).toBe('Scheduled');
    expect(describeStatus(5)).toBe('Repaired');
    expect(describeStatus(6)).toBe('completed');
  });

  it('falls back rather than throwing on a step this build does not know', () => {
    expect(describeStatus(99 as unknown as 0)).toBe('Reported');
  });

  it('passes an already-named status through', () => {
    expect(describeStatus('Scheduled')).toBe('Scheduled');
  });
});

const ANALYSIS = {
  filePath: 'http://127.0.0.1:9000/reportimage/reportimage/f8086949.jpg',
  problemName: 'Pipe_Damage',
  problemArabic: 'تسريب في الأنبوب',
  // The vision service formats confidence as "95.98%", so ParseConfidence stores 95.98.
  confidence: 95.98,
  severity: 'حرجة جداً' as const,
  recommendation: 'أوقف مصدر المياه',
  explanation: 'شرح',
  repairSteps: ['خطوة'],
};

// POST /Issue/create was removed server-side on 3 Oct, and analyze already enqueued the
// creation, so filing a report is one call and createIssue is its local half (§0.1/§4.1).
describe('createIssue', () => {
  beforeEach(async () => {
    mockPost.mockReset();
    mockGet.mockReset();
    mockGetTokenUserId.mockReset();
    mockGetTokenUserId.mockResolvedValue(REPORTER_ID);
    await resetReportMirror();
  });

  it('makes no network call at all', async () => {
    await createIssue({ analysis: ANALYSIS });

    expect(mockPost).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('builds the report out of the analysis the farmer was just shown', async () => {
    const report = await createIssue({
      analysis: ANALYSIS,
      description: 'ماء على السطح',
      latitude: 29.2,
      longitude: 25.5,
    });

    expect(report).toMatchObject({
      title: 'تسريب في الأنبوب',
      description: 'ماء على السطح',
      // Node 2: the diagnosis exists, so hasAiAnalysis has to read true.
      status: 'Diagnosed',
      reporterId: REPORTER_ID,
      latitude: 29.2,
      longitude: 25.5,
    });
    expect(report.analysis).toMatchObject({ severity: 'حرجة جداً', modelVersion: '' });
    expect(report.attachments).toEqual([
      expect.objectContaining({ type: 'Photo', url: ANALYSIS.filePath }),
    ]);
  });

  // Not guid-shaped on purpose: isServerIssueId must read it as local, not ask the map for it.
  it('mints a local id that cannot be mistaken for a server guid', async () => {
    const report = await createIssue({ analysis: ANALYSIS });

    expect(report.id).toMatch(/^local-/);
    expect(report.id).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  // Whatever the severity: the diagnosis screen reads this row back by id straight after filing.
  it('mirrors the report so getReportById can find it', async () => {
    const report = await createIssue({ analysis: ANALYSIS });

    await expect(getReportById(report.id)).resolves.toMatchObject({ id: report.id });
    expect(mockGet).not.toHaveBeenCalled();
  });

  // Folded once, at the boundary: analyze is handed its own un-normalised server response.
  it('folds the percentage confidence in analyzeIssue', async () => {
    mockPost.mockResolvedValue({ ...ANALYSIS, confidence: 95.98 });

    const analysis = await analyzeIssue({ uri: 'file:///photo.jpg' });

    expect(analysis.confidence).toBeCloseTo(0.9598);
  });
});

/**
 * The invariant the concatenation in getMyReports rests on: the mirror lists only what §4.1
 * refuses to create, so the two halves cannot hold the same report and no matching is needed.
 */
describe('what the list shows from the mirror', () => {
  beforeEach(async () => {
    mockGet.mockReset();
    mockGet.mockResolvedValue([]);
    mockGetTokenUserId.mockReset();
    mockGetTokenUserId.mockResolvedValue(REPORTER_ID);
    await resetReportMirror();
  });

  const listedIds = async () => (await getMyReports()).map(report => report.id);

  // The four §4.1 maps to Low or Unknown. The server creates nothing for any of them.
  it.each(['بسيطة', 'بسيطة جداً', 'غير مؤثرة', 'غير معروفة'] as const)(
    'lists a %s report, because the backend never created one',
    async severity => {
      const report = await createIssue({ analysis: { ...ANALYSIS, severity } });

      await expect(listedIds()).resolves.toEqual([report.id]);
    },
  );

  // The six that map to Medium or above. The server has these, so listing them would duplicate.
  it.each(['حرجة جداً', 'حرجة', 'عالية جداً', 'عالية', 'متوسطة', 'منخفضة'] as const)(
    'hides a %s report, because the server is creating one',
    async severity => {
      await createIssue({ analysis: { ...ANALYSIS, severity } });

      await expect(listedIds()).resolves.toEqual([]);
    },
  );

  // ReportService's mapping ends in `_ => Unknown`, so an unlisted severity creates nothing.
  it('lists a report whose severity it does not recognise', async () => {
    const report = await createIssue({
      analysis: { ...ANALYSIS, severity: 'Critical' },
    });

    await expect(listedIds()).resolves.toEqual([report.id]);
  });

  // A Medium+ report is addressable by its local id even though the list hides it.
  it('still resolves a hidden report by id', async () => {
    const report = await createIssue({ analysis: { ...ANALYSIS, severity: 'عالية' } });

    await expect(getReportById(report.id)).resolves.toMatchObject({
      id: report.id,
      status: 'Diagnosed',
    });
  });
});

// Nullable is on server-side, so a null in any non-`?` field of AiAnalysisResponse is a 400 on create.
describe('the analysis create receives', () => {
  // What analyze really returns: the vision service's success body has no problem_code.
  const FROM_SERVER = {
    filePath: 'reportimage/f8086949.jpg',
    problemName: null,
    problemArabic: 'تسريب في الأنبوب',
    confidence: 92.5,
    severity: 'عالية',
    recommendation: null,
    explanation: 'شرح',
    repairSteps: null,
  };

  beforeEach(async () => {
    mockPost.mockReset();
    await resetReportMirror();
  });

  it('fills every required field analyze can leave null', async () => {
    mockPost.mockResolvedValue(FROM_SERVER);

    const analysis = await analyzeIssue({ uri: 'file:///photo.jpg' });

    expect(analysis.problemName).toBe('تسريب في الأنبوب');
    expect(analysis.recommendation).toBe('');
    expect(analysis.repairSteps).toEqual([]);
    expect(analysis.severity).toBe('عالية');
  });

});

const REPORTER_ID = 'f86295b1-6d2e-4a6f-9d2a-0c1b3e5a7d91';

/** One GetFarmerIssues row, with every field §4.3 says is on it. */
function row(overrides: Partial<GetFarmerIssuesWire> = {}): GetFarmerIssuesWire {
  return {
    issueId: 'i-1',
    title: 'تسريب في الأنبوب',
    description: 'ماء على السطح',
    createdAt: '2026-10-05T19:47:30',
    status: 2,
    slotStart: '09:00:00',
    slotEnd: '11:00:00',
    sceduleDate: '2026-10-09T00:00:00',
    reporterId: REPORTER_ID,
    expertName: 'سيد حسن',
    expertUrl: 'profile-pictures/sayed.jpg',
    expertId: 'e-1',
    teamName: null,
    ...overrides,
  };
}

describe('getMyReports', () => {
  beforeEach(async () => {
    mockGet.mockReset();
    mockGetTokenUserId.mockReset();
    mockGetTokenUserId.mockResolvedValue(REPORTER_ID);
    await resetReportMirror();
  });

  // Send it in one place only and GetAllIssuesByReporterIdAsync throws Unauthorized every time.
  it('sends the reporter guid in the path and in the query string', async () => {
    mockGet.mockResolvedValue([]);

    await getMyReports();

    expect(mockGet).toHaveBeenCalledWith(
      API_BASE_URLS.issue,
      `/Farmer/issues/${REPORTER_ID}?ReporterId=${REPORTER_ID}`,
      { authenticated: true },
    );
  });

  it('maps a row onto a Report', async () => {
    mockGet.mockResolvedValue([row()]);

    const [report] = await getMyReports();

    expect(report).toEqual({
      id: 'i-1',
      title: 'تسريب في الأنبوب',
      description: 'ماء على السطح',
      // The int, through the corrected table: 2 is Assigned, not Verified.
      status: 'Assigned',
      createdAt: '2026-10-05T19:47:30Z',
      reporterId: REPORTER_ID,
      attachments: [],
    });
    // Nothing invented for what the payload does not carry.
    expect(report.analysis).toBeUndefined();
  });

  it('reads the status as an int, not a string', async () => {
    mockGet.mockResolvedValue([row({ status: 3 }), row({ issueId: 'i-2', status: 6 })]);

    const reports = await getMyReports();

    expect(reports.map(report => report.status)).toEqual(
      expect.arrayContaining(['Reviewed', 'completed']),
    );
  });

  it('merges the mirror into the server rows, newest first', async () => {
    mockGet.mockResolvedValue([
      row({ issueId: 'server-old', createdAt: '2026-08-09T13:01:13.4206342' }),
      row({ issueId: 'server-new', createdAt: '2026-08-10T12:45:58.0923551' }),
    ]);
    await saveMirroredReport({
      id: 'mirrored-middle',
      status: 'Diagnosed',
      createdAt: '2026-08-09T13:37:59.6010209Z',
      reporterId: REPORTER_ID,
      attachments: [],
    });

    const reports = await getMyReports();

    expect(reports.map(report => report.id)).toEqual([
      'server-new',
      'mirrored-middle',
      'server-old',
    ]);
  });

  // Sending `undefined` as the guid would collect an Unauthorized and read as a session problem.
  it('refuses to call the server without a reporter id', async () => {
    mockGetTokenUserId.mockResolvedValue(null);

    await expect(getMyReports()).rejects.toThrow(/ReporterId/);
    expect(mockGet).not.toHaveBeenCalled();
  });

  // بلاغاتي has an error state; a half list presented as the whole one would be worse.
  it('lets a failed server read reach the screen', async () => {
    mockGet.mockRejectedValue(new Error('connection refused'));

    await expect(getMyReports()).rejects.toThrow('connection refused');
  });
});

describe('getReportById', () => {
  beforeEach(async () => {
    mockGet.mockReset();
    mockGetTokenUserId.mockReset();
    mockGetTokenUserId.mockResolvedValue(REPORTER_ID);
    await resetReportMirror();
  });

  // The only place a report filed seconds ago exists, and it costs no request.
  it('answers from the mirror without calling the server', async () => {
    await saveMirroredReport({
      id: 'local-1',
      status: 'Diagnosed',
      createdAt: '2026-10-05T19:47:30Z',
      reporterId: REPORTER_ID,
      attachments: [],
    });

    await expect(getReportById('local-1')).resolves.toMatchObject({ id: 'local-1' });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('falls back to the server list for a report the mirror never held', async () => {
    mockGet.mockResolvedValue([row({ issueId: 'i-9' })]);

    await expect(getReportById('i-9')).resolves.toMatchObject({
      id: 'i-9',
      status: 'Assigned',
    });
  });

  // useIssueDetails treats this as "not mine" and falls through to the map.
  it('throws when neither half has it', async () => {
    mockGet.mockResolvedValue([row()]);

    await expect(getReportById('someone-elses')).rejects.toThrow(/someone-elses/);
  });
});

describe('buildAnalyzeFormData', () => {
  // Jest runs on Node's FormData, which has the standard accessors RN's own lacks in its types.
  type Readable = { get: (name: string) => unknown; keys: () => Iterable<string> };
  const read = (form: FormData) => form as unknown as Readable;

  it('sends the coordinate as AnalyzeIssueRequest\'s Latitude and Longitude fields', () => {
    const form = read(
      buildAnalyzeFormData({ uri: 'file:///photo.jpg' }, { latitude: 25.4378, longitude: 30.5531 }),
    );

    expect(form.get('Latitude')).toBe('25.4378');
    expect(form.get('Longitude')).toBe('30.5531');
  });

  it('sends only the photo when there is no coordinate, rather than a "undefined" string', () => {
    const form = read(buildAnalyzeFormData({ uri: 'file:///photo.jpg' }));

    expect([...form.keys()]).toEqual(['Photo']);
  });
});
