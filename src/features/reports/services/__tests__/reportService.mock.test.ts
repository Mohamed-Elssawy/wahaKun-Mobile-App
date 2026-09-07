import type { PickedImage } from '@/types/image';

import {
  CONFIDENCE_THRESHOLD,
  analyzeIssue,
  createIssue,
  getReportById,
  resetMockReports,
} from '../reportService.mock';

const PHOTO: PickedImage = { uri: 'file:///test-report.jpg' };

/** The mock simulates latency: 2200ms to analyse, 900ms to create. */
const TIMEOUT = 20_000;

describe('reportService mock:analyzeIssue', () => {
  // The mock's state is module-level, so each test would inherit the last one's.
  beforeEach(resetMockReports);

  it(
    'diagnoses the photo before anything is filed',
    async () => {
      const analysis = await analyzeIssue(PHOTO);

      // create is called with this whole object, so every field it reads must be here.
      expect(analysis.filePath).toBeTruthy();
      expect(analysis.severity).toBeTruthy();
      expect(analysis.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
      // Pinned so the mock cannot promise a stored report that does not exist yet.
      expect(analysis).not.toHaveProperty('id');
    },
    TIMEOUT,
  );

  it(
    'alternates confidence so both branches are reachable in dev',
    async () => {
      await analyzeIssue(PHOTO);
      const unsure = await analyzeIssue(PHOTO);

      expect(unsure.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
    },
    TIMEOUT,
  );
});

describe('reportService mock:createIssue', () => {
  beforeEach(resetMockReports);

  it(
    'files an already-diagnosed issue and keeps the analysis on it',
    async () => {
      const analysis = await analyzeIssue(PHOTO);
      const report = await createIssue({ analysis, description: 'وصف' });

      expect(report.id).toBeTruthy();
      // There is no unanalysed state any more: create runs after the model, not before.
      expect(report.status).toBe('Diagnosed');
      expect(report.analysis?.confidence).toBe(analysis.confidence);
      expect(report.title).toBe(analysis.problemArabic);
    },
    TIMEOUT,
  );

  it(
    'stores the analysed photo against the report',
    async () => {
      const analysis = await analyzeIssue(PHOTO);
      const created = await createIssue({ analysis });
      const fetched = await getReportById(created.id);

      expect(fetched.attachments).toHaveLength(1);
      expect(fetched.attachments[0].url).toBe(PHOTO.uri);
    },
    TIMEOUT,
  );

  it(
    'rejects an unknown report id',
    async () => {
      await expect(getReportById('r-does-not-exist')).rejects.toThrow();
    },
    TIMEOUT,
  );
});
