import { TIER_ORDER, worstTier } from './tier';

import type { IssueBounds, MapCluster, MapIssue } from './types';

/** Below this span the map draws one pin per issue. F-05 has two states, so this is the line between them. */
export const ZOOMED_IN_SPAN = 0.08;

/** How many cells the visible span is divided into when clustering. */
const GRID_DIVISIONS = 5;

/** About 45 metres: two reports on one canal land this close and share a pixel even zoomed in. */
export const COINCIDENT_SPAN = 0.0004;

export function isZoomedIn(latitudeSpan: number): boolean {
  return latitudeSpan <= ZOOMED_IN_SPAN;
}

/** Worst first, then newest, which is the order X-11 stacks its cards in. */
function byUrgency(a: MapIssue, b: MapIssue): number {
  const severity = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
  if (severity !== 0) {
    return severity;
  }
  // Parsed rather than compared as text: only a naive timestamp is normalised to UTC.
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

const single = (issue: MapIssue): MapCluster => ({
  id: issue.id,
  latitude: issue.latitude,
  longitude: issue.longitude,
  tier: issue.tier,
  issues: [issue],
  isCoincident: false,
});

/** The smallest box holding every issue. Undefined for an empty list, which has no box. */
export function boundsOf(issues: readonly MapIssue[]): IssueBounds | undefined {
  if (issues.length === 0) {
    return undefined;
  }

  const latitudes = issues.map(issue => issue.latitude);
  const longitudes = issues.map(issue => issue.longitude);

  return {
    west: Math.min(...longitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    north: Math.max(...latitudes),
  };
}

/** True when zooming further could not pull the group apart. */
function isCoincident(issues: readonly MapIssue[]): boolean {
  const box = boundsOf(issues);
  return (
    box !== undefined &&
    box.north - box.south < COINCIDENT_SPAN &&
    box.east - box.west < COINCIDENT_SPAN
  );
}

/** Grid, not centroid: a pin has to hold still while the farmer pans, and a centroid moves every frame. */
export function clusterIssues(
  issues: readonly MapIssue[],
  latitudeSpan: number,
): MapCluster[] {
  // Zoomed in the grid still runs, but only tightly enough to catch what would overlap.
  const cell = isZoomedIn(latitudeSpan)
    ? COINCIDENT_SPAN
    : Math.max(latitudeSpan / GRID_DIVISIONS, Number.EPSILON);

  const buckets = new Map<string, MapIssue[]>();

  for (const issue of issues) {
    const key = `${Math.floor(issue.latitude / cell)}:${Math.floor(issue.longitude / cell)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(issue);
    } else {
      buckets.set(key, [issue]);
    }
  }

  return [...buckets.entries()].map(([key, bucket]) => {
    if (bucket.length === 1) {
      return single(bucket[0]);
    }

    // Averaged, so the count sits among its issues rather than on the cell's corner.
    const total = bucket.length;
    return {
      id: `cluster-${key}`,
      latitude: bucket.reduce((sum, issue) => sum + issue.latitude, 0) / total,
      longitude: bucket.reduce((sum, issue) => sum + issue.longitude, 0) / total,
      tier: worstTier(bucket.map(issue => issue.tier)),
      issues: [...bucket].sort(byUrgency),
      isCoincident: isCoincident(bucket),
    };
  });
}
