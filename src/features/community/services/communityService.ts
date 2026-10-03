/** GetCommentsByIssueId is [Authorize] and is the only real CommunityService endpoint in use. */

import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';
import { toUtcTimestamp } from '@/features/reports/services/reportService';
import { getUserDetails } from '@/features/user/services/userService';

import type { Comment, CommentsPage, CommentsPageWire, CommunityApi } from '../types';

const BASE = API_BASE_URLS.community;

const UNKNOWN_AUTHOR = 'مزارع من الواحة';

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

export const communityApi: CommunityApi = { getComments };
