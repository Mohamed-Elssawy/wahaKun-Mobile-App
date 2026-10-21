import { farmerIssueRow } from '@/__fixtures__/wire/farmerIssues';
import { API_ENDPOINTS } from '@/api/endpoints';
import { API_BASE_URLS } from '@/config/env';

import {
  farmerIssuePhotoKey,
  fromFarmerIssue,
  fromTracking,
  getReportTracker,
  resolveAttachmentUrl,
} from '../reportService';

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

describe('farmer list photo key (issue 1)', () => {
  const rowWith = (overrides: Record<string, unknown>) =>
    farmerIssueRow(overrides) as unknown as GetFarmerIssuesWire;

  it('reads the key the 13 October probe saw', () => {
    expect(farmerIssuePhotoKey(rowWith({ imageUrl: 'reportimage/pipe.jpg' }))).toBe(
      'reportimage/pipe.jpg',
    );
  });

  it('reads the key under the spelling e98684f sent', () => {
    // imagegurl is how GetFarmerIssues declares it on backend master at e98684f.
    expect(
      farmerIssuePhotoKey(
        rowWith({ imageUrl: undefined, imagegurl: 'reportimage/pipe.jpg' }),
      ),
    ).toBe('reportimage/pipe.jpg');
  });

  it('reads the key under the spelling 92b621c corrected it to', () => {
    // `imageurl`, one g fewer, and a single `FirstOrDefault()` key rather than a collection.
    expect(
      farmerIssuePhotoKey(
        rowWith({ imageUrl: undefined, imageurl: 'reportimage/pipe.jpg' }),
      ),
    ).toBe('reportimage/pipe.jpg');
  });

  // A server mid-rename could send both, so the newest spelling wins.
  it('prefers the corrected spelling when a row carries more than one', () => {
    expect(
      farmerIssuePhotoKey(
        rowWith({
          imageUrl: 'reportimage/old.jpg',
          imagegurl: 'reportimage/older.jpg',
          imageurl: 'reportimage/new.jpg',
        }),
      ),
    ).toBe('reportimage/new.jpg');
  });

  it('is null, not an invented key, when the server sends none', () => {
    expect(farmerIssuePhotoKey(rowWith({ imageUrl: null }))).toBeNull();

    // An older server omits the key, which is why imageUrl is the one optional field.
    const old = farmerIssueRow();
    delete old.imageUrl;
    expect(farmerIssuePhotoKey(old as unknown as GetFarmerIssuesWire)).toBeNull();
  });

  // IssueProfile maps a Select into a string, so AutoMapper falls back to ToString().
  it('treats the AutoMapper ToString() value as no key', () => {
    expect(
      farmerIssuePhotoKey(
        rowWith({
          imageUrl: undefined,
          imagegurl:
            'System.Linq.Enumerable+WhereSelectListIterator`2[Issue.Domain.Entities.Issue.IssueAttachment,System.String]',
        }),
      ),
    ).toBeNull();
  });

  it('rejects anything else that is not key-shaped', () => {
    for (const value of ['', '   ', 'no-folder.jpg', 'issues/noextension', '[]']) {
      expect(
        farmerIssuePhotoKey(rowWith({ imageUrl: undefined, imagegurl: value })),
      ).toBeNull();
    }
  });

  // Storage serves bytes, so the list row's key becomes the attachment the card draws.
  it('resolves the list photo key to a storage url', () => {
    expect(
      fromFarmerIssue(rowWith({ imageUrl: 'reportimage/pipe.jpg' })).attachments,
    ).toEqual([
      expect.objectContaining({
        type: 'Photo',
        url: resolveAttachmentUrl('reportimage/pipe.jpg'),
      }),
    ]);
  });

  // The builder is asserted on its own, so a change to the gate cannot hide a change to it.
  it('builds that url from the storage endpoint and the key', () => {
    expect(resolveAttachmentUrl('reportimage/pipe.jpg')).toBe(
      `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download('reportimage/pipe.jpg')}`,
    );
  });
});

describe('tracker (issue 5)', () => {
  beforeEach(() => mockGet.mockReset());

  // The segment-only form was never observed working; tracking.wire.test.ts has the evidence.
  it('asks the real endpoint with the issue id in the path and the query', async () => {
    mockGet.mockResolvedValue(tracking());

    await getReportTracker(ISSUE_ID);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][1]).toBe(
      `/Farmer/${ISSUE_ID}/tracking?issueId=${ISSUE_ID}`,
    );
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
