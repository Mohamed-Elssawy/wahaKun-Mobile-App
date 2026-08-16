import {
  CONFIDENCE_THRESHOLD,
  analyzeReport,
  createReport,
  getReportById,
  resetMockReports,
} from '../reportService.mock';

import type { CreateReportFields } from '../../types';

// Pins the gate being off; turning it back on is meant to break the second test.
const PHOTO: CreateReportFields = { photo: { uri: 'file:///test-report.jpg' } };

/** The mock simulates latency: 900ms to create, 2200ms to analyse. */
const TIMEOUT = 20_000;

describe('reportService mock:the confidence gate', () => {
  // The mock's state is module-level, so each test would inherit the last one's.
  beforeEach(resetMockReports);

  it(
    'marks a report Analyzed when confidence reaches the threshold',
    async () => {
      const created = await createReport(PHOTO);
      const analyzed = await analyzeReport(created.id);

      expect(analyzed.analysis?.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
      expect(analyzed.status).toBe('Analyzed');
    },
    TIMEOUT,
  );

  it(
    'shows a low-confidence report instead of escalating it',
    async () => {
      const created = await createReport(PHOTO);

      // The mock alternates, so the first call takes the high-confidence turn.
      await analyzeReport(created.id);
      const unsure = await analyzeReport(created.id);

      expect(unsure.analysis?.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
      // Analyzed, not Escalated: nothing anywhere produces Escalated today.
      expect(unsure.status).toBe('Analyzed');

      // A low confidence is not a missing one, asserted here to reuse the fixture.
      expect(unsure.analysis).toBeDefined();
      expect(unsure.updatedAt).toBeDefined();
    },
    TIMEOUT,
  );

  it(
    'rejects an unknown report id',
    async () => {
      await expect(analyzeReport('r-does-not-exist')).rejects.toThrow();
    },
    TIMEOUT,
  );
});

describe('reportService mock:createReport', () => {
  beforeEach(resetMockReports);

  it(
    'returns an id and a Pending status, unanalysed',
    async () => {
      const created = await createReport(PHOTO);

      // The whole flow rests on this field: it is what AnalyzeReport is called with.
      expect(created.id).toBeTruthy();
      expect(created.status).toBe('Pending');
      // Pinned so the mock cannot drift wider than CreateReportResponse.
      expect(created).not.toHaveProperty('analysis');
      expect(created).not.toHaveProperty('attachments');
    },
    TIMEOUT,
  );

  it(
    'still stores the photo, even though create does not return it',
    async () => {
      const created = await createReport(PHOTO);
      const fetched = await getReportById(created.id);

      expect(fetched.attachments).toHaveLength(1);
      expect(fetched.attachments[0].url).toBe(PHOTO.photo.uri);
    },
    TIMEOUT,
  );
});
