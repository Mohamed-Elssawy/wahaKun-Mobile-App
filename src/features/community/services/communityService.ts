/** Every CommunityController endpoint is [Authorize], hence `authenticated: true` throughout. */

import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';
import { describeTier, normalizeMapStatus } from '@/features/map/tier';
import {
  resolveAttachmentUrl,
  toUtcTimestamp,
} from '@/features/reports/services/reportService';
import {
  getUserDetails,
  resolveProfilePictureUrl,
} from '@/features/user/services/userService';

import { distanceKm } from '../distance';

import type {
  Comment,
  CommentsPage,
  CommentsPageWire,
  CommunityApi,
  FeedPage,
  FeedPageWire,
  FeedPost,
  FeedPostWire,
  FeedQuery,
  VoteResult,
} from '../types';

const BASE = API_BASE_URLS.community;

const UNKNOWN_AUTHOR = 'مزارع من الواحة';

/** "Nearby" has no server-side distance sort (coordinates are strings in SQL), so it pulls a wide page. */
const NEARBY_PAGE_SIZE = 100;

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
        // A missing name must not empty the feed; forget the failure so a later load retries.
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

function toPost(wire: FeedPostWire, author?: Author): FeedPost {
  const status = normalizeMapStatus(wire.status);
  return {
    issueId: wire.issueId,
    title: wire.title,
    description: wire.description ?? undefined,
    photoUrl: wire.photoUrl ? resolveAttachmentUrl(wire.photoUrl) : undefined,
    status,
    tier: describeTier(wire.priority, status),
    createdAt: toUtcTimestamp(wire.createdAt),
    latitude: wire.latitude ?? undefined,
    longitude: wire.longitude ?? undefined,
    reporterId: wire.reporterId,
    reporterName: author?.name ?? UNKNOWN_AUTHOR,
    reporterPicture: author?.picture,
    confirmations: wire.voteCount,
    commentCount: wire.commentCount,
    shareCount: wire.shareCount,
    hasConfirmed: wire.hasVoted,
  };
}

export async function getFeed(query: FeedQuery): Promise<FeedPage> {
  const isNearby = query.filter === 'nearby';
  // The server knows all, critical, inProgress and resolved; nearby is "all" sorted here by distance.
  const serverFilter = isNearby ? 'all' : query.filter;
  const pageSize = isNearby ? NEARBY_PAGE_SIZE : query.pageSize;
  const page = isNearby ? 1 : query.page;

  if (isNearby && query.page > 1) {
    return { posts: [], hasMore: false };
  }

  const wire = await apiClient.get<FeedPageWire>(
    BASE,
    `/feed?page=${page}&pageSize=${pageSize}&filter=${encodeURIComponent(serverFilter)}`,
    { authenticated: true },
  );

  const authors = await resolveAuthors(wire.items.map(item => item.reporterId));
  let posts = wire.items.map(item => toPost(item, authors.get(item.reporterId)));

  if (isNearby && query.origin) {
    const origin = query.origin;
    posts = posts
      .filter(post => post.latitude !== undefined && post.longitude !== undefined)
      .sort(
        (a, b) =>
          distanceKm(origin, { latitude: a.latitude!, longitude: a.longitude! }) -
          distanceKm(origin, { latitude: b.latitude!, longitude: b.longitude! }),
      );
    return { posts, hasMore: false };
  }

  return { posts, hasMore: wire.hasMore };
}

/** "هل تواجه نفس المشكلة؟" Adds the farmer's confirmation, or removes it. */
export function toggleConfirmation(issueId: string): Promise<VoteResult> {
  return apiClient.post<VoteResult>(BASE, `/issues/${issueId}/vote`, undefined, {
    authenticated: true,
  });
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

export const communityApi: CommunityApi = { getFeed, getComments, toggleConfirmation };
