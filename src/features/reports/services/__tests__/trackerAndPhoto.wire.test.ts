import { farmerIssueRow } from '@/__fixtures__/wire/farmerIssues';
import { API_ENDPOINTS } from '@/api/endpoints';
import { API_BASE_URLS } from '@/config/env';

import { fromFarmerIssue, fromTracking, getReportTracker } from '../reportService';

import type { GetFarmerIssuesWire, IssueTrackingWire } from '../../types';

const mockGet = jest.fn();

jest.mock('@/api', () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args), post: jest.fn() },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
  getTokenUserId: jest.fn(),
}));

const ISSUE_ID = '62337e98-c425-4817-6484-08df2764951d';

const tracking = (overrides: Partial<IssueTrackingWire> = {}): IssueTrackingWire => ({
  issueId: ISSUE_ID,
  currentStatus: 2,
  steps: [
    {
      status: 1,
      name: 'Diagnosed',
      state: 2,
      changedAt: '2026-10-11T07:00:00',
      note: 'Issue Diagnosed by system',
      expertId: null,
      expertName: null,
      expertPhoto: null,
      repairPhoto: null,
    },
    {
      status: 2,
      name: 'Assigned',
      state: 1,
      changedAt: '2026-10-11T08:00:00',
      note: null,
      expertId: 'e-1',
      expertName: 'سيد حسن',
      expertPhoto: null,
      repairPhoto: null,
    },
  ],
  ...overrides,
});

describe('farmer list photo (issue 1)', () => {
  it('shows the photo the server names, resolved through MediaStorageService', () => {
    const row = farmerIssueRow({
      imageUrl: 'reportimage/pipe.jpg',
    }) as unknown as GetFarmerIssuesWire;

    const [photo] = fromFarmerIssue(row).attachments;

    expect(photo.type).toBe('Photo');
    expect(photo.url).toBe(
      `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download('reportimage/pipe.jpg')}`,
    );
  });

  it('has no attachment, not an invented one, when the server sends none', () => {
    const row = farmerIssueRow({ imageUrl: null }) as unknown as GetFarmerIssuesWire;
    expect(fromFarmerIssue(row).attachments).toEqual([]);

    const old = farmerIssueRow() as unknown as GetFarmerIssuesWire;
    expect(fromFarmerIssue(old).attachments).toEqual([]);
  });
});

describe('tracker (issue 5)', () => {
  beforeEach(() => mockGet.mockReset());

  it('asks the real endpoint with the issue id in the path', async () => {
    mockGet.mockResolvedValue(tracking());

    await getReportTracker(ISSUE_ID);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][1]).toBe(`/Farmer/${ISSUE_ID}/tracking`);
  });

  it('maps status, expert and review state, and never shows the server audit note', () => {
    const details = fromTracking(tracking());

    expect(details.reportId).toBe(ISSUE_ID);
    expect(details.status).toBe('Assigned');
    expect(details.hasExpertReview).toBe(false);
    expect(details.expert).toEqual({ name: 'سيد حسن', specialty: '' });
    expect(JSON.stringify(details)).not.toContain('by system');
  });

  it('treats Reviewed and later as an expert review having happened', () => {
    expect(fromTracking(tracking({ currentStatus: 3 })).hasExpertReview).toBe(true);
  });

  it('does not call the server for a report only this device knows about', async () => {
    await expect(getReportTracker('local-abc-123')).rejects.toThrow();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
