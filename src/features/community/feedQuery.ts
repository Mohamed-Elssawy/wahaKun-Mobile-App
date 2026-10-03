/** The tab, chip and sort semantics F-01 draws, shared so the mock and the real path agree. */
// Pure and in one file because both services page client-side today, and the backend's own
// GetAllIssues spec ANDs three mutually exclusive predicates, so it cannot be copied.
import { isClosedWireStatus } from '@/features/reports/lifecycle';

import { distanceKm } from './distance';

import type { Coordinates, FeedPost, FeedQuery, FeedSeverity } from './types';

/** How near قريب مني means. Siwa's cultivated belt is a few km across, so this is generous. */
export const NEARBY_RADIUS_KM = 5;

/** Worst first, which is what the ترتيب: الخطورة option means. */
const SEVERITY_RANK: Record<FeedPost['tier'], number> = {
  critical: 0,
  medium: 1,
  low: 2,
  resolved: 3,
};

function matchesTab(post: FeedPost, tab: FeedQuery['tab']): boolean {
  if (tab === 'active') {
    return !isClosedWireStatus(post.status);
  }
  if (tab === 'resolved') {
    return isClosedWireStatus(post.status);
  }
  return true;
}

// An empty set is "no severity filter", not "match nothing": every chip off shows everything.
function matchesSeverity(post: FeedPost, severities: readonly FeedSeverity[]): boolean {
  if (severities.length === 0) {
    return true;
  }
  return severities.some(severity => severity === post.tier);
}

export function hasCoordinates(
  post: FeedPost,
): post is FeedPost & { latitude: number; longitude: number } {
  return post.latitude !== undefined && post.longitude !== undefined;
}

// Degrades to a no-op without a fix rather than emptying the feed: a denied location permission
// must not look like "no reports near you".
function matchesNearby(post: FeedPost, query: FeedQuery): boolean {
  if (!query.nearbyOnly || !query.origin) {
    return true;
  }
  if (!hasCoordinates(post)) {
    return false;
  }
  return distanceKm(query.origin, post) <= NEARBY_RADIUS_KM;
}

const newestFirst = (a: FeedPost, b: FeedPost) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

function nearestFirst(origin: Coordinates) {
  return (a: FeedPost, b: FeedPost) => {
    // A post with no fix sorts last rather than throwing off the order with a NaN.
    const left = hasCoordinates(a) ? distanceKm(origin, a) : Number.POSITIVE_INFINITY;
    const right = hasCoordinates(b) ? distanceKm(origin, b) : Number.POSITIVE_INFINITY;
    return left - right;
  };
}

export function sortFeed(posts: readonly FeedPost[], query: FeedQuery): FeedPost[] {
  const sorted = [...posts];

  if (query.sort === 'nearest' && query.origin) {
    return sorted.sort(nearestFirst(query.origin));
  }

  if (query.sort === 'severity') {
    // Newest breaks the tie, so two critical reports still read in the order they arrived.
    return sorted.sort(
      (a, b) => SEVERITY_RANK[a.tier] - SEVERITY_RANK[b.tier] || newestFirst(a, b),
    );
  }

  return sorted.sort(newestFirst);
}

export function filterFeed(posts: readonly FeedPost[], query: FeedQuery): FeedPost[] {
  return posts.filter(
    post =>
      matchesTab(post, query.tab) &&
      matchesSeverity(post, query.severities) &&
      matchesNearby(post, query),
  );
}

/** Both services page in memory: neither ShowIssueInMap nor GetAllIssuesAsync takes a page. */
export function pageFeed(posts: readonly FeedPost[], query: FeedQuery) {
  const start = (query.page - 1) * query.pageSize;
  const slice = posts.slice(start, start + query.pageSize);

  return { posts: slice, hasMore: start + slice.length < posts.length };
}

/** filter, then sort, then page. Sorting before filtering would page the wrong rows. */
export function applyFeedQuery(posts: readonly FeedPost[], query: FeedQuery) {
  return pageFeed(sortFeed(filterFeed(posts, query), query), query);
}
