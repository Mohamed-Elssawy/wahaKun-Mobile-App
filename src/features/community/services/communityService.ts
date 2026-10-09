/** CommunityController's one endpoint, GetCommentsByIssueId, plus CommunityHub's writes and live
 * events for a server issue. A seeded issue (non-Guid id) stays on the mock end to end. */
// Never add a path here that CommunityController does not declare: the gateway answers it with a bare 404.

import { API_ENDPOINTS, apiClient, getTokenUserId } from '@/api';
import { API_BASE_URLS } from '@/config/env';
import { toUtcTimestamp } from '@/features/reports/services/reportService';
import { getUserDetails, resolveProfilePictureUrl } from '@/features/user/services/userService';

import * as hub from './communityHub';
import * as mock from './communityService.mock';

import type {
  Comment,
  CommentEventWire,
  CommentsPage,
  CommentsPageWire,
  CommunityApi,
  IssueLiveEvent,
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

/** CommentResponseDto and the hub's CommentEventDto carry the same fields. */
function toComment(wire: CommentEventWire, author: Author | undefined): Comment {
  return {
    id: wire.id,
    issueId: wire.issueId,
    authorId: wire.userId,
    authorName: author?.name ?? UNKNOWN_AUTHOR,
    authorPicture: author?.picture,
    // UserDetailsResponse has no role, so the خبير معتمد badge can never be earned yet.
    isExpert: false,
    text: wire.text ?? '',
    voiceUrl: wire.voiceUrl || undefined,
    createdAt: toUtcTimestamp(wire.createdAt),
  };
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

  const comments = wire.comments.map(comment => toComment(comment, authors.get(comment.userId)));

  return {
    comments,
    total: wire.count,
    hasMore: (page - 1) * pageSize + comments.length < wire.count,
  };
}

/** CommunityHub.SendComment. The hub moderates first, so this can reject with COMMENT_REJECTED. */
export async function postComment(issueId: string, text: string): Promise<Comment> {
  if (!isServerIssueId(issueId)) {
    return mock.postComment(issueId, text);
  }
  const wire = await hub.sendComment(issueId, text);
  return toComment(wire, await resolveAuthor(wire.userId));
}

/** CommunityHub.VoteIssue. A toggle whose answer says where the vote ended up, so no guessing. */
export async function toggleConfirmation(issueId: string): Promise<VoteResult> {
  if (!isServerIssueId(issueId)) {
    return mock.toggleConfirmation(issueId);
  }
  const state = await hub.toggleVote(issueId);
  return { issueId, hasVoted: state.hasVoted, voteCount: state.count };
}

/** CommunityHub.ShareIssue. Resolves to the new share count. */
export function shareIssue(issueId: string): Promise<number> {
  return isServerIssueId(issueId) ? hub.shareIssue(issueId) : mock.shareIssue(issueId);
}

export function subscribeToIssue(
  issueId: string,
  listener: (event: IssueLiveEvent) => void,
): () => void {
  if (!isServerIssueId(issueId)) {
    return mock.subscribeToIssue();
  }

  return hub.watchIssue(issueId, {
    onCommentAdded: (wire, total) => {
      // The author lookup is cached and never rejects, so the event always arrives.
      resolveAuthor(wire.userId).then(author =>
        listener({ type: 'commentAdded', comment: toComment(wire, author), total }),
      );
    },
    onCommentDeleted: (commentId, total) => listener({ type: 'commentDeleted', commentId, total }),
    onVotes: (count, voterId, voted) => {
      getTokenUserId()
        .catch(() => null)
        .then(me =>
          listener({
            type: 'votes',
            count,
            voted,
            byMe: Boolean(me) && me?.toLowerCase() === voterId.toLowerCase(),
          }),
        );
    },
    onShares: count => listener({ type: 'shares', count }),
  });
}

export const communityApi: CommunityApi = {
  // No feed or single-issue read exists in CommunityController - BACKEND-CONTRACT-REQUESTS 1-3.
  getFeed: mock.getFeed,
  getIssue: mock.getIssue,
  getPost: mock.getIssue,
  toggleConfirmation,
  shareIssue,
  postComment,
  getComments,
  subscribeToIssue,
};
