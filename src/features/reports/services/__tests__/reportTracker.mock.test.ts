import {
  confirmResolution,
  getReportTracker,
  rejectResolution,
  resetMockTracker,
} from '../reportTracker.mock';

describe('reportTracker mock:getReportTracker', () => {
  beforeEach(resetMockTracker);

  it('rejects an unknown report id', async () => {
    await expect(getReportTracker('does-not-exist')).rejects.toThrow();
  });

  it('serves every seeded F-06 state', async () => {
    for (const id of ['1050', '1043', '1040', '1035', '1037', '1020', '1045', '1046']) {
      await expect(getReportTracker(id)).resolves.toMatchObject({ reportId: id });
    }
  });

  it('marks 1045 reopened and 1046 expert-reassigned - development-only states', async () => {
    await expect(getReportTracker('1045')).resolves.toMatchObject({ reopened: true });
    await expect(getReportTracker('1046')).resolves.toMatchObject({
      expertReassigned: true,
    });
  });
});

describe('reportTracker mock:confirmResolution', () => {
  beforeEach(resetMockTracker);

  it('closes the case, farmer-attributed, with a fresh closedAt', async () => {
    const before = Date.now();
    await confirmResolution('1037');
    const after = await getReportTracker('1037');

    expect(after.status).toBe('completed');
    expect(after.closedBy).toBe('farmer');
    expect(new Date(after.closedAt as string).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('rejects an unknown report id', async () => {
    await expect(confirmResolution('does-not-exist')).rejects.toThrow();
  });
});

describe('reportTracker mock:rejectResolution', () => {
  beforeEach(resetMockTracker);

  it('returns the case to node 3 with the same expert and clears nodes 4-5 (C-REOPEN-CLEAN)', async () => {
    const original = await getReportTracker('1037');

    await rejectResolution('1037');
    const after = await getReportTracker('1037');

    expect(after.status).toBe('Assigned');
    expect(after.hasExpertReview).toBe(false);
    expect(after.expert).toEqual(original.expert);
    expect(after.appointment).toBeUndefined();
    expect(after.repair).toBeUndefined();
  });
});
