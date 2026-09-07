// camelCase from the Web defaults; MapResponseDto declares Priority and Status as strings.

import type { ReportStatus } from '@/features/reports/types';

/** IssuePriority by name. `"4"` reaches the client too: Map's enum stops at 3, ReportService writes 4. */
export type MapPriorityName = 'Unknown' | 'Low' | 'Medium' | 'High' | 'Critical';

/** MapResponseDto verbatim. `longitde` is missing its `u` and can only be fixed in the backend. */
export type MapIssueWire = {
  issueId: string;
  /** Yes, `longitde`. A decimal as a string, or null for an issue filed without a fix. */
  longitde: string | null;
  latitude: string | null;
  /** A MinIO object key such as `reportimage/x.jpg`, not a URL. */
  photoUrl: string | null;
  createdAt: string;
  /** A name, or a bare number as a string while the two IssuePriority enums disagree. */
  priority: string;
  /** An IssueStatus name. `completed` is lower-case server-side; the rest are capitalised. */
  status: string;
  title: string;
};

/** What the map draws. Coordinates are numbers and always present. */
export type MapIssue = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  status: ReportStatus;
  /** Already collapsed to the four tiers the legend names. */
  tier: MapIssueTier;
  createdAt: string;
};

/** The legend's four rows. Resolved wins over severity: a fixed problem reads green. */
export type MapIssueTier = 'critical' | 'medium' | 'low' | 'resolved';

/** A box around a set of issues, in the corner order MapLibre's `bounds` expects. */
export type IssueBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

/** A pin the map draws: one issue, or several collapsed behind a count. */
export type MapCluster = {
  id: string;
  latitude: number;
  longitude: number;
  /** The worst tier it holds, which is what colours it. */
  tier: MapIssueTier;
  /** Sorted worst first, then newest, which is the order X-11's sheet lists them in. */
  issues: MapIssue[];
  /** Zooming cannot pull these apart, so a tap lists them rather than zooming. */
  isCoincident: boolean;
};
