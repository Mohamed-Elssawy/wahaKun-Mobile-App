// Asserts the seed actually reaches F-05's three states, not just that someone looked once.

import { clusterIssues, COINCIDENT_SPAN, ZOOMED_IN_SPAN } from '../clustering';
import { getMapIssueById, getMapIssues } from '../services/mapService.mock';

import type { MapIssueTier } from '../types';

/** The span F-05 opens at, wide enough to hold the oasis. */
const WIDE_SPAN = 0.2;

describe('the seeded map', () => {
  it('serves issues the map can place, with every tier the legend names', async () => {
    const issues = await getMapIssues();

    expect(issues.length).toBeGreaterThan(8);

    for (const issue of issues) {
      expect(Number.isFinite(issue.latitude)).toBe(true);
      expect(Number.isFinite(issue.longitude)).toBe(true);
      expect(issue.title.trim()).not.toBe('');
    }

    const tiers = new Set<MapIssueTier>(issues.map(issue => issue.tier));
    expect(tiers).toEqual(new Set(['critical', 'medium', 'low', 'resolved']));
  });

  it('collapses into clusters at the opening zoom', async () => {
    const clusters = clusterIssues(await getMapIssues(), WIDE_SPAN);
    const grouped = clusters.filter(cluster => cluster.issues.length > 1);

    expect(grouped.length).toBeGreaterThan(0);
    expect(clusters.length).toBeLessThan((await getMapIssues()).length);
  });

  it('draws one pin per issue once zoomed in, except where they coincide', async () => {
    const issues = await getMapIssues();
    const clusters = clusterIssues(issues, ZOOMED_IN_SPAN);

    // Every issue is still represented, whether as its own pin or inside the stack.
    const drawn = clusters.reduce((total, cluster) => total + cluster.issues.length, 0);
    expect(drawn).toBe(issues.length);
  });

  it('holds a coincident stack, which is the state real data will not produce', async () => {
    const clusters = clusterIssues(await getMapIssues(), ZOOMED_IN_SPAN);
    const stack = clusters.find(cluster => cluster.isCoincident);

    expect(stack).toBeDefined();
    expect(stack?.issues.length).toBeGreaterThanOrEqual(3);

    // Inside COINCIDENT_SPAN of each other on both axes, which is what makes them one stack.
    const latitudes = stack?.issues.map(issue => issue.latitude) ?? [];
    expect(Math.max(...latitudes) - Math.min(...latitudes)).toBeLessThan(COINCIDENT_SPAN);
  });

  it('answers a single issue by id, and null for one it does not hold', async () => {
    const [first] = await getMapIssues();

    await expect(getMapIssueById(first.id)).resolves.toMatchObject({ id: first.id });
    await expect(getMapIssueById('m-nope')).resolves.toBeNull();
  });
});
