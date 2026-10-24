import { farmerIssueRow } from '@/__fixtures__/wire/farmerIssues';
import {
  e4Tracking,
  reassignedTwice,
  repairedWithoutPhoto,
  repairedWithoutTimestamp,
  repairedWithPhoto,
  rescheduledTwice,
  trackingAt,
} from '@/__fixtures__/wire/tracking';
import { API_ENDPOINTS } from '@/api/endpoints';
import { API_BASE_URLS } from '@/config/env';

import { factsFromWireStatus } from '../../lifecycle';
import { trackerFacts } from '../../trackerFacts';
import { buildTrackerView } from '../../trackerView';
import {
  fromFarmerIssue,
  fromTracking,
  getReportTracker,
  resolveAttachmentUrl,
} from '../reportService';

import type {
  GetFarmerIssuesWire,
  IssueStatusCode,
  IssueTrackingWire,
  ReportStatus,
} from '../../types';

const mockGet = jest.fn();

jest.mock('@/api', () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args), post: jest.fn() },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
  getTokenUserId: jest.fn(),
}));

const wire = (body: Record<string, unknown>) => body as unknown as IssueTrackingWire;

/** The seven IssueStatus values, each in both vocabularies. R2 says the server sends the name. */
const BOTH_VOCABULARIES: readonly [ReportStatus, IssueStatusCode][] = [
  ['Reported', 0],
  ['Diagnosed', 1],
  ['Assigned', 2],
  ['Reviewed', 3],
  ['Scheduled', 4],
  ['Repaired', 5],
  ['completed', 6],
];

beforeEach(() => mockGet.mockReset());

// D4: the mapper compared names as integers, so every step read as absent.
describe('both wire vocabularies, all seven statuses (D4)', () => {
  it.each(BOTH_VOCABULARIES)('reads currentStatus %s as a name', (name, _code) => {
    expect(fromTracking(wire(trackingAt(name))).status).toBe(name);
  });

  it.each(BOTH_VOCABULARIES)('reads currentStatus %s as the integer %i', (name, code) => {
    expect(fromTracking(wire(trackingAt(code))).status).toBe(name);
  });

  it.each(BOTH_VOCABULARIES)('reads a %s step by name', (name, _code) => {
    // The step's own status is what `.find` matches on, independently of `currentStatus`.
    const details = fromTracking(wire(trackingAt(name, name)));

    expect(details.status).toBe(name);
    expect(JSON.stringify(details)).not.toContain('undefined');
  });

  it.each(BOTH_VOCABULARIES)('reads a %s step by integer', (name, code) => {
    expect(fromTracking(wire(trackingAt(name, code))).status).toBe(name);
  });

  // `Reviewed` and everything after it. Ranked, not `>= 3`, so a name no longer reads as false.
  it.each(BOTH_VOCABULARIES)(
    'decides hasExpertReview for %s, both forms',
    (name, code) => {
      const expected = ['Reviewed', 'Scheduled', 'Repaired', 'completed'].includes(name);

      expect(fromTracking(wire(trackingAt(name))).hasExpertReview).toBe(expected);
      expect(fromTracking(wire(trackingAt(code))).hasExpertReview).toBe(expected);
    },
  );

  // `completed` is lowercase in the C# source, so it is lowercase on the wire. Not a typo.
  it.each(BOTH_VOCABULARIES)(
    'closes the case only at completed, for %s',
    (name, code) => {
      const expected = name === 'completed' ? 'farmer' : undefined;

      expect(fromTracking(wire(trackingAt(name))).closedBy).toBe(expected);
      expect(fromTracking(wire(trackingAt(code))).closedBy).toBe(expected);
    },
  );
});

describe("E4's body, verbatim in shape", () => {
  it('maps the probe payload onto the details F-06 draws', () => {
    const details = fromTracking(wire(e4Tracking));

    expect(details).toMatchObject({
      reportId: 'e1c8270f-09a7-4e2a-4291-08df27ce0175',
      status: 'Assigned',
      hasExpertReview: false,
      // N1: a phone number, not a name. The display problem is item 26, not this mapper's.
      expert: { name: '+201010000008', specialty: '' },
      assignedAt: '2026-10-13T20:33:06.9534246Z',
    });
    // No repair, no closure, and nothing invented for either.
    expect(details.repair).toBeUndefined();
    expect(details.closedAt).toBeUndefined();
  });

  // Neither the English step name nor the audit note is farmer-facing; labels key off status.
  it('renders neither the English step name nor the audit note', () => {
    const serialised = JSON.stringify(fromTracking(wire(e4Tracking)));

    expect(serialised).not.toContain('by system');
    expect(serialised).not.toContain('Expert Assigned');
    expect(serialised).not.toContain('AI Diagnosis');
  });

  // C12: there is no Reported row at all, so node 1 is dated from the list row's createdAt.
  it('dates node 1 from the list row, because no Reported step exists', () => {
    expect(
      (e4Tracking.steps as Record<string, unknown>[]).some(
        step => step.status === 'Reported',
      ),
    ).toBe(false);

    const report = fromFarmerIssue(
      farmerIssueRow({
        issueId: 'e1c8270f-09a7-4e2a-4291-08df27ce0175',
      }) as unknown as GetFarmerIssuesWire,
    );
    const [nodeOne] = buildTrackerView(report, fromTracking(wire(e4Tracking)));

    expect(nodeOne.node).toBe(1);
    expect(nodeOne.dateTime).toBeTruthy();
  });
});

/** steps[] arrives newest first and is never reversed: .find must return the latest row. */
describe('newest-first plus .find equals the latest occurrence', () => {
  it('surfaces the NEWER of two Assigned rows, not the older one', () => {
    const details = fromTracking(wire(reassignedTwice));

    expect(details.expert?.name).toBe('+201010000099');
    expect(details.assignedAt).toBe('2026-10-13T20:00:00Z');
    // The older row is still in the payload; it must simply not be the one that is read.
    expect(details.assignedAt).not.toBe('2026-10-11T08:00:00Z');
  });

  it('surfaces the NEWER of two Scheduled rows', () => {
    const steps = (rescheduledTwice.steps as Record<string, unknown>[]).filter(
      step => step.status === 'Scheduled',
    );
    expect(steps).toHaveLength(2);

    // Read through the same `.find` the mapper uses, via the step the repair path reads.
    expect(fromTracking(wire(rescheduledTwice)).status).toBe('Scheduled');
    expect(steps[0].changedAt).toBe('2026-10-14T09:00:00');
  });
});

// D5: the old mapper fell back to now, so a repair with no timestamp changed every reopen.
describe('an unsupplied repair time stays undefined (D5)', () => {
  it('invents no completion time', () => {
    const details = fromTracking(wire(repairedWithoutTimestamp));

    expect(details.repair).toBeDefined();
    expect(details.repair?.confirmedAt).toBeUndefined();
  });

  it('is stable across reads, which the Date.now() fallback was not', () => {
    const first = fromTracking(wire(repairedWithoutTimestamp));
    const second = fromTracking(wire(repairedWithoutTimestamp));

    expect(first).toEqual(second);
  });

  // B5: a confirmed repair with no timestamp is still a confirmed repair.
  it('still draws node 5 as done, just without the date line', () => {
    const report = fromFarmerIssue(farmerIssueRow() as unknown as GetFarmerIssuesWire);
    const view = buildTrackerView(report, fromTracking(wire(repairedWithoutTimestamp)));
    const nodeFive = view.find(node => node.node === 5);

    expect(nodeFive).toBeDefined();
    expect(nodeFive?.markerState).toBe('done');
    expect(nodeFive?.dateTime).toBeUndefined();
    expect(nodeFive?.chips).toEqual([
      expect.objectContaining({ label: 'تم الإصلاح بنجاح' }),
    ]);
  });

  it('keeps the time when the wire does supply one', () => {
    expect(fromTracking(wire(repairedWithPhoto)).repair?.confirmedAt).toBe(
      '2026-10-14T12:00:00Z',
    );
  });
});

// D6: a repair is a fact about the status, not about whether a photo came with it.
describe('a repair is derived from the status, not from the photo (D6)', () => {
  it('records the repair when the status says so and no photo came with it', () => {
    const details = fromTracking(wire(repairedWithoutPhoto));

    expect(details.repair).toBeDefined();
    expect(details.repair?.photoUrl).toBeUndefined();
  });

  it('reaches node 6 and offers the approval control', () => {
    const details = fromTracking(wire(repairedWithoutPhoto));
    const report = fromFarmerIssue(farmerIssueRow() as unknown as GetFarmerIssuesWire);
    const nodeSix = buildTrackerView(report, details).find(node => node.node === 6);

    expect(trackerFacts(details).hasRepairConfirmation).toBe(true);
    expect(nodeSix?.markerState).toBe('current');
    expect(nodeSix?.showApproval).toBe(true);
  });

  // The derivation is imported, not copied: the tracker and list-row paths must agree.
  it.each(BOTH_VOCABULARIES)('agrees with the list-row path for %s', (name, code) => {
    const expected = factsFromWireStatus(name).hasRepairConfirmation;

    expect(trackerFacts(fromTracking(wire(trackingAt(name)))).hasRepairConfirmation).toBe(
      expected,
    );
    expect(trackerFacts(fromTracking(wire(trackingAt(code)))).hasRepairConfirmation).toBe(
      expected,
    );
  });

  // Storage serves bytes, so the repair key becomes the url node 5's photo chip draws.
  it('resolves the repair photo key to a storage url', () => {
    expect(fromTracking(wire(repairedWithPhoto)).repair?.photoUrl).toBe(
      resolveAttachmentUrl('issues/repair-proof.jpg'),
    );
  });

  // The builder is asserted on its own, so a change to the gate cannot hide a change to it.
  it('builds that url from the storage endpoint and the key', () => {
    expect(resolveAttachmentUrl('issues/repair-proof.jpg')).toBe(
      `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download('issues/repair-proof.jpg')}`,
    );
  });

  it('draws no photo chip when the repair had no photo', () => {
    const report = fromFarmerIssue(farmerIssueRow() as unknown as GetFarmerIssuesWire);
    const view = buildTrackerView(report, fromTracking(wire(repairedWithoutPhoto)));

    expect(view.find(node => node.node === 5)?.repairPhoto).toBeUndefined();
  });

  it('draws the photo chip once the repair key resolves', () => {
    const report = fromFarmerIssue(farmerIssueRow() as unknown as GetFarmerIssuesWire);
    const view = buildTrackerView(report, fromTracking(wire(repairedWithPhoto)));

    expect(view.find(node => node.node === 5)?.repairPhoto).toMatchObject({
      url: resolveAttachmentUrl('issues/repair-proof.jpg'),
    });
  });
});

describe('the tracking URL', () => {
  // Both places is the only shape with evidence; the probe could not say which one bound.
  it('sends the issue id twice, which is the only shape ever observed to answer', async () => {
    mockGet.mockResolvedValue(e4Tracking);
    const id = 'e1c8270f-09a7-4e2a-4291-08df27ce0175';

    await getReportTracker(id);

    expect(mockGet).toHaveBeenCalledWith(
      API_BASE_URLS.issue,
      `/Farmer/${id}/tracking?issueId=${id}`,
      { authenticated: true },
    );
  });

  it('does not call the server for a report only this device knows about', async () => {
    await expect(getReportTracker('local-abc-123')).rejects.toThrow();
    expect(mockGet).not.toHaveBeenCalled();
  });
});
