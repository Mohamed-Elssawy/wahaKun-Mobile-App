/** GetCommentsByIssueId is [Authorize]; the feed is composed from MapService, which is not. */

// IssueService.FarmerService.GetAllIssuesAsync already returns everything F-01 draws, but no
// controller exposes it, so the feed still falls back to ShowIssueInMap and loses the author
// and the counters. That is what USE_MOCK_COMMUNITY exists for.

import { API_ENDPOINTS, apiClient } from '@/api';
import { ApiError } from '@/api/errors';
import { API_BASE_URLS } from '@/config/env';
import { getMapIssueById, getMapIssues } from '@/features/map/services/mapService';
import type { MapIssue } from '@/features/map/types';
import { toUtcTimestamp } from '@/features/reports/services/reportService';
import { userApi } from '@/features/user/services';

import { applyFeedQuery } from '../feedQuery';

import type {
  Comment,
  CommentsPage,
  CommentsPageWire,
  CommunityApi,
  FeedPage,
  FeedPost,
  FeedQuery,
  IssueDetails,
  VoteResult,
} from '../types';

const BASE = API_BASE_URLS.community;

const UNKNOWN_AUTHOR = 'مزارع من الواحة';

/** Issue ids are Guids; the seed's `i-1043` style ids would bind to nothing and come back 400. */
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isServerIssueId(issueId: string): boolean {
  return GUID.test(issueId);
}

type Author = { name: string; picture?: string };

/** Cached for the app session: authors repeat across pages and refreshes. */
const authorCache = new Map<string, Promise<Author>>();

function resolveAuthor(userId: string): Promise<Author> {
  if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
    return Promise.resolve({ name: UNKNOWN_AUTHOR });
  }

  let pending = authorCache.get(userId);
  if (!pending) {
    pending = getUserDetails(userId)
      .then(user => ({
        name: user.fullName || UNKNOWN_AUTHOR,
        picture: user.picture ? resolveProfilePictureUrl(user.picture) : undefined,
      }))
      .catch(() => {
        // A missing name must not empty the thread; forget the failure so a later load retries.
        authorCache.delete(userId);
        return { name: UNKNOWN_AUTHOR };
      });
    authorCache.set(userId, pending);
  }
  return pending;
}

async function resolveAuthors(userIds: readonly string[]): Promise<Map<string, Author>> {
  const unique = [...new Set(userIds)];
  const entries = await Promise.all(
    unique.map(async id => [id, await resolveAuthor(id)] as const),
  );
  return new Map(entries);
}

/** GET api/Community/GetCommentsByIssueId for a real issue; the seed's thread for a seeded one. */
export async function getComments(
  issueId: string,
  page: number,
  pageSize: number,
): Promise<CommentsPage> {
  if (!isServerIssueId(issueId)) {
    return mock.getComments(issueId, page, pageSize);
  }

  const wire = await apiClient.get<CommentsPageWire>(
    BASE,
    API_ENDPOINTS.community.comments(issueId, page, pageSize),
    { authenticated: true },
  );

  const authors = await resolveAuthors(wire.comments.map(comment => comment.userId));

  const comments: Comment[] = wire.comments.map(comment => {
    const author = authors.get(comment.userId);
    return {
      id: comment.id,
      issueId: comment.issueId,
      authorId: comment.userId,
      authorName: author?.name ?? UNKNOWN_AUTHOR,
      authorPicture: author?.picture,
      // UserDetailsResponse has no role, so the خبير معتمد badge can never be earned yet.
      isExpert: false,
      text: comment.text,
      voiceUrl: comment.voiceUrl || undefined,
      createdAt: toUtcTimestamp(comment.createdAt),
    };
  });

  return {
    comments,
    total: wire.count,
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
  getIssue,
  getComments,
  toggleConfirm,
  shareIssue,
  postComment,
};
