/** GetCommentsByIssueId is [Authorize]; the feed is composed from MapService, which is not. */

// ShowIssueInMap is the only call returning everything, but it costs the author and counters, which is why USE_MOCK_COMMUNITY exists for demo work.

import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';
import { getMapIssues } from '@/features/map/services/mapService';
import type { MapIssue } from '@/features/map/types';
import { toUtcTimestamp } from '@/features/reports/services/reportService';
import { isResolvedStatus } from '@/features/reports/status';
import { getUserDetails } from '@/features/user/services/userService';

import { distanceKm } from '../distance';

import type {
  Comment,
  CommentsPage,
  CommentsPageWire,
  CommunityApi,
  FeedPage,
  FeedPost,
  FeedQuery,
} from '../types';

const BASE = API_BASE_URLS.community;

const UNKNOWN_AUTHOR = 'مزارع من الواحة';

function toPost(issue: MapIssue): FeedPost {
  return {
    issueId: issue.id,
    title: issue.title,
    photoUrl: issue.photoUrl,
    status: issue.status,
    tier: issue.tier,
    createdAt: issue.createdAt,
    latitude: issue.latitude,
    longitude: issue.longitude,
    // Zero rather than absent: the card renders the row, the backend just cannot fill it.
    confirmations: 0,
    commentCount: 0,
    shareCount: 0,
    hasConfirmed: false,
  };
}

const MATCHES: Record<FeedQuery['filter'], (post: FeedPost) => boolean> = {
  all: () => true,
  critical: post => post.tier === 'critical',
  nearby: () => true,
  inProgress: post => !isResolvedStatus(post.status),
  resolved: post => isResolvedStatus(post.status),
};

/** Paged client-side: ShowIssueInMap returns everything. The signature is what GetFeed would take. */
export async function getFeed(query: FeedQuery): Promise<FeedPage> {
  const issues = await getMapIssues();
  let posts = issues.map(toPost).filter(MATCHES[query.filter]);

  if (query.filter === 'nearby' && query.origin) {
    const origin = query.origin;
    posts = posts
      .filter(post => post.latitude !== undefined && post.longitude !== undefined)
      .sort(
        (a, b) =>
          distanceKm(origin, { latitude: a.latitude!, longitude: a.longitude! }) -
          distanceKm(origin, { latitude: b.latitude!, longitude: b.longitude! }),
      );
  } else {
    posts.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  const start = (query.page - 1) * query.pageSize;
  const slice = posts.slice(start, start + query.pageSize);

  return { posts: slice, hasMore: start + slice.length < posts.length };
}

/** One lookup per distinct author, not per comment: a thread repeats its participants. */
async function resolveAuthors(userIds: readonly string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)];

  const entries = await Promise.all(
    unique.map(async userId => {
      try {
        const user = await getUserDetails(userId);
        return [userId, user.fullName || UNKNOWN_AUTHOR] as const;
      } catch {
        // A missing name must not empty the thread; the comment still has its text.
        return [userId, UNKNOWN_AUTHOR] as const;
      }
    }),
  );

  return new Map(entries);
}

export async function getComments(
  issueId: string,
  page: number,
  pageSize: number,
): Promise<CommentsPage> {
  const wire = await apiClient.get<CommentsPageWire>(
    BASE,
    API_ENDPOINTS.community.comments(issueId, page, pageSize),
    { authenticated: true },
  );

  const authors = await resolveAuthors(wire.comments.map(comment => comment.userId));

  const comments: Comment[] = wire.comments.map(comment => ({
    id: comment.id,
    issueId: comment.issueId,
    authorId: comment.userId,
    authorName: authors.get(comment.userId) ?? UNKNOWN_AUTHOR,
    // UserDetailsResponse has no role, so the خبير معتمد badge can never be earned yet.
    isExpert: false,
    text: comment.text,
    voiceUrl: comment.voiceUrl || undefined,
    createdAt: toUtcTimestamp(comment.createdAt),
  }));

  return {
    comments,
    total: wire.count,
    // count is the Redis total, so this stays right past the last full page.
    hasMore: (page - 1) * pageSize + comments.length < wire.count,
  };
}

export const communityApi: CommunityApi = { getFeed, getComments };
