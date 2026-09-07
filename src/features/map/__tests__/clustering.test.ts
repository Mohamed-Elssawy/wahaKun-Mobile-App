import { clusterIssues, isZoomedIn, ZOOMED_IN_SPAN } from '../clustering';

import type { MapIssue, MapIssueTier } from '../types';

const issue = (
  id: string,
  latitude: number,
  longitude: number,
  tier: MapIssueTier = 'medium',
  createdAt = '2026-08-09T13:01:13Z',
): MapIssue => ({
  id,
  title: id,
  latitude,
  longitude,
  status: 'Diagnosed',
  tier,
  createdAt,
});

describe('isZoomedIn', () => {
  it('splits F-05 into its two states at one threshold', () => {
    expect(isZoomedIn(ZOOMED_IN_SPAN)).toBe(true);
    expect(isZoomedIn(ZOOMED_IN_SPAN - 0.01)).toBe(true);
    expect(isZoomedIn(ZOOMED_IN_SPAN + 0.01)).toBe(false);
  });
});

describe('clusterIssues', () => {
  it('draws separated issues separately once zoomed in', () => {
    const issues = [issue('a', 29.2, 25.5), issue('b', 29.24, 25.54)];

    const clusters = clusterIssues(issues, 0.01);

    expect(clusters).toHaveLength(2);
    expect(clusters.every(cluster => cluster.issues.length === 1)).toBe(true);
    expect(clusters.every(cluster => !cluster.isCoincident)).toBe(true);
  });

  // Several reports about one canal share a pixel, so a pin each hides all but one.
  it('merges issues too close to separate, even zoomed in', () => {
    const issues = [
      issue('a', 29.175, 25.4899, 'medium'),
      issue('b', 29.175, 25.4899, 'critical'),
      issue('c', 29.175, 25.4899, 'medium'),
    ];

    const [cluster, ...rest] = clusterIssues(issues, 0.01);

    expect(rest).toHaveLength(0);
    expect(cluster.issues).toHaveLength(3);
    expect(cluster.isCoincident).toBe(true);
  });

  // X-11 stacks its cards worst first, and the pin takes its colour from the same issue.
  it('puts the most severe issue first in a cluster', () => {
    const issues = [
      issue('mild', 29.175, 25.4899, 'resolved'),
      issue('worst', 29.175, 25.4899, 'critical'),
      issue('mid', 29.175, 25.4899, 'medium'),
    ];

    expect(clusterIssues(issues, 0.01)[0].issues[0].id).toBe('worst');
  });

  // Without a tiebreak the sheet would list equals in whatever order the server sent.
  it('breaks a severity tie with the newest issue', () => {
    const issues = [
      issue('older', 29.175, 25.4899, 'critical', '2026-08-01T09:00:00Z'),
      issue('newest', 29.175, 25.4899, 'critical', '2026-08-09T09:00:00Z'),
      issue('middle', 29.175, 25.4899, 'critical', '2026-08-05T09:00:00Z'),
    ];

    expect(clusterIssues(issues, 0.01)[0].issues.map(entry => entry.id)).toEqual([
      'newest',
      'middle',
      'older',
    ]);
  });

  it('does not call a spread-out cluster coincident', () => {
    const issues = [issue('a', 29.2, 25.5), issue('b', 29.26, 25.56)];

    expect(clusterIssues(issues, 0.4)[0].isCoincident).toBe(false);
  });

  it('collapses neighbours into one counted pin when zoomed out', () => {
    const issues = [
      issue('a', 29.2, 25.5),
      issue('b', 29.2001, 25.5001),
      issue('c', 29.2002, 25.5002),
    ];

    const [cluster, ...rest] = clusterIssues(issues, 0.4);

    expect(rest).toHaveLength(0);
    expect(cluster.issues).toHaveLength(3);
    // Averaged, so the count sits among its issues rather than on the cell corner.
    expect(cluster.latitude).toBeCloseTo(29.2001, 3);
  });

  it('keeps distant issues apart at the same zoom', () => {
    const issues = [issue('near', 29.2, 25.5), issue('far', 29.9, 26.4)];

    expect(clusterIssues(issues, 0.4)).toHaveLength(2);
  });

  // A critical issue hidden inside a green cluster is the one outcome that matters.
  it('colours a cluster by the worst issue in it', () => {
    const issues = [
      issue('a', 29.2, 25.5, 'resolved'),
      issue('b', 29.2001, 25.5001, 'critical'),
    ];

    expect(clusterIssues(issues, 0.4)[0].tier).toBe('critical');
  });

  it('has nothing to draw for no issues', () => {
    expect(clusterIssues([], 0.4)).toEqual([]);
  });
});
