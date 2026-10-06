import { API_BASE_URLS } from '@/config/env';

import {
  analyzeIssue,
  createIssue,
  describeStatus,
  getMyReports,
  normalizeConfidence,
  resolveAttachmentUrl,
  toUtcTimestamp,
} from '../reportService';
import { resetReportMirror, saveMirroredReport } from '../reportStore';

const mockPost = jest.fn();

jest.mock('@/api', () => ({
  apiClient: { post: (...args: unknown[]) => mockPost(...args) },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
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
describe('describeStatus', () => {
  it('names every IssueStatus the server can send', () => {
    expect(describeStatus(0)).toBe('Reported');
    expect(describeStatus(1)).toBe('Diagnosed');
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

// POST /Issue/create was removed server-side on 3 Oct; createIssue is a stub until S5b
// rebuilds it onto the one-call /Issue/analyze flow (BACKEND-INTEGRATION-FACTS.md §0.1).
describe('createIssue', () => {
  it('throws rather than posting to a route the server no longer has', async () => {
    await expect(createIssue({ analysis: ANALYSIS })).rejects.toThrow(/Issue\/create/);
    expect(mockPost).not.toHaveBeenCalled();
  });

  // Folded once, at the boundary: analyze is handed its own un-normalised server response.
  it('folds the percentage confidence in analyzeIssue', async () => {
    mockPost.mockResolvedValue({ ...ANALYSIS, confidence: 95.98 });

    const analysis = await analyzeIssue({ uri: 'file:///photo.jpg' });

    expect(analysis.confidence).toBeCloseTo(0.9598);
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

// The mirror stands in for GetMyIssues, which IssueController no longer exposes. createIssue
// no longer writes it (see the createIssue describe above), so this seeds it directly.
describe('getMyReports', () => {
  beforeEach(async () => {
    await resetReportMirror();
  });

  it('puts the newest report first', async () => {
    for (const [id, createdAt] of [
      ['oldest', '2026-08-09T13:01:13.4206342Z'],
      ['newest', '2026-08-10T12:45:58.0923551Z'],
      ['middle', '2026-08-09T13:37:59.6010209Z'],
    ]) {
      await saveMirroredReport({
        id,
        status: 'Diagnosed',
        createdAt,
        reporterId: 'f86295b1',
        attachments: [],
      });
    }

    const reports = await getMyReports();

    expect(reports.map(report => report.id)).toEqual(['newest', 'middle', 'oldest']);
  });
});
