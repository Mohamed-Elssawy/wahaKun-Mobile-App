/** GetCommentsByIssueId is [Authorize]; the feed is composed from MapService, which is not. */

// IssueService.FarmerService.GetAllIssuesAsync already returns everything F-01 draws, but no
// controller exposes it, so the feed still falls back to ShowIssueInMap and loses the author
// and the counters. That is what USE_MOCK_COMMUNITY exists for.

import { API_ENDPOINTS, apiClient } from '@/api';
import { ApiError } from '@/api/errors';
import { API_BASE_URLS } from '@/config/env';
import { getMapIssues } from '@/features/map/services/mapService';
import type { MapIssue } from '@/features/map/types';
import { toUtcTimestamp } from '@/features/reports/services/reportService';
import { getUserDetails } from '@/features/user/services/userService';

import { applyFeedQuery } from '../feedQuery';

import type {
  Comment,
  CommentsPage,
  CommentsPageWire,
  CommunityApi,
  FeedPage,
  FeedPost,
  FeedQuery,
  VoteResult,
} from '../types';

const BASE = API_BASE_URLS.community;

const UNKNOWN_AUTHOR = 'مزارع من الواحة';

/** 501, not 0: the server is reachable and the feature is absent, so a retry cannot help. */
const NOT_IMPLEMENTED = 501;

// Thrown rather than resolved, so a screen shows the failure instead of a control that lied.
function hubUnavailable(action: string): never {
  throw new ApiError(
    `${action} يحتاج اتصال CommunityHub، وهو غير متاح بعد`,
    NOT_IMPLEMENTED,
  );
}

function toPost(issue: MapIssue): FeedPost {
  return {
    issueId: issue.id,
    title: issue.title,
    photoUrl: issue.photoUrl,
    // MapResponseDto lists no attachments, so a voice-only issue is indistinguishable here.
    hasVoice: false,
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

/** Paged client-side: ShowIssueInMap returns everything. The signature is what GetFeed would take. */
export async function getFeed(query: FeedQuery): Promise<FeedPage> {
  const issues = await getMapIssues();

  return applyFeedQuery(issues.map(toPost), query);
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

// The three writes below exist on CommunityHub over SignalR at /hubs/community, not over REST,
// and no SignalR client is installed. They throw so the seam is real and the failure is visible.
export async function toggleConfirm(_issueId: string): Promise<VoteResult> {
  return hubUnavailable('تأكيد المشكلة');
}

export async function shareIssue(_issueId: string): Promise<number> {
  return hubUnavailable('مشاركة البلاغ');
}

export async function postComment(_issueId: string, _text: string): Promise<Comment> {
  return hubUnavailable('إضافة تعليق');
}

export const communityApi: CommunityApi = {
  getFeed,
  getComments,
  toggleConfirm,
  shareIssue,
  postComment,
};
