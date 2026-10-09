// Seeded feed for when no endpoint exposes GetAllIssuesAsync, so F-01 can show the author,
// the counters and the confirm state the real path cannot yet. ./index.ts picks one.

import { emptyOnEmptyScenario, failOnErrorScenario, mockDelay } from '@/api/mockScenario';
import { resolveRole } from '@/features/user/role';

import { applyFeedQuery } from '../feedQuery';
import { SEED_COMMENTS, SEED_POSTS, SEED_VOICE } from '../fixtures';

import type {
  Comment,
  CommentsPage,
  CommunityApi,
  FeedPage,
  FeedQuery,
  IssueDetails,
  VoteResult,
} from '../types';

const LATENCY = { feed: 700, comments: 500, write: 400 } as const;

const FEED_ERROR = 'تعذر تحميل المجتمع';
const COMMENTS_ERROR = 'تعذر تحميل التعليقات';
const WRITE_ERROR = 'تعذر إتمام العملية';

// Module scope, not a hook: a vote has to survive leaving the screen, the way the server's would.
const posts = SEED_POSTS.map(post => ({ ...post }));
const comments: Comment[] = SEED_COMMENTS.map(comment => ({ ...comment }));

/** The signed-in farmer, for a comment the mock appends. The real path reads it off the token. */
const ME = { id: 'u-me', name: 'أنت' } as const;

function findPost(issueId: string) {
  const post = posts.find(row => row.issueId === issueId);
  if (!post) {
    throw new Error(`Mock: no issue with id ${issueId}`);
  }
  return post;
}

export async function getFeed(query: FeedQuery): Promise<FeedPage> {
  await mockDelay(LATENCY.feed);
  failOnErrorScenario(FEED_ERROR);

  return applyFeedQuery(emptyOnEmptyScenario(posts), query);
}

export async function getIssue(issueId: string): Promise<IssueDetails | null> {
  await mockDelay(LATENCY.feed);
  failOnErrorScenario(FEED_ERROR);

  const post = posts.find(row => row.issueId === issueId);
  if (!post) {
    return null;
  }

  const voice = SEED_VOICE[issueId];

  return { ...post, voiceUrl: voice?.url, transcript: voice?.transcript };
}

export async function getComments(
  issueId: string,
  page: number,
  pageSize: number,
): Promise<CommentsPage> {
  await mockDelay(LATENCY.comments);
  failOnErrorScenario(COMMENTS_ERROR);

  const all = emptyOnEmptyScenario(
    comments.filter(comment => comment.issueId === issueId),
  );
  const start = (page - 1) * pageSize;
  const slice = all.slice(start, start + pageSize);

  return {
    comments: [...slice],
    total: all.length,
    hasMore: start + slice.length < all.length,
  };
}

/** Toggles: a second call undoes the first rather than erroring. */
export async function toggleConfirmation(issueId: string): Promise<VoteResult> {
  await mockDelay(LATENCY.write);
  failOnErrorScenario(WRITE_ERROR);

  const post = findPost(issueId);
  post.hasConfirmed = !post.hasConfirmed;
  post.confirmations += post.hasConfirmed ? 1 : -1;

  return { issueId, hasVoted: post.hasConfirmed, voteCount: post.confirmations };
}

export async function shareIssue(issueId: string): Promise<number> {
  await mockDelay(LATENCY.write);
  failOnErrorScenario(WRITE_ERROR);

  const post = findPost(issueId);
  // The hub only ever increments; there is no un-share.
  post.shareCount += 1;

  return post.shareCount;
}

export async function postComment(issueId: string, text: string): Promise<Comment> {
  await mockDelay(LATENCY.write);
  failOnErrorScenario(WRITE_ERROR);

  // No role reaches a real comment yet (Comment.isExpert is hardcoded false server-side);
  // the mock reads the same role switch useIdentity does, so §10.5's badge is demoable at all.
  const isExpert = resolveRole(null).role === 'expert';

  const comment: Comment = {
    id: `c-${Date.now()}`,
    issueId,
    authorId: ME.id,
    authorName: ME.name,
    isExpert,
    text,
    createdAt: new Date().toISOString(),
  };

  comments.push(comment);

  // The counter on F-01 has to move too; the hub increments it in the same call.
  const post = posts.find(row => row.issueId === issueId);
  if (post) {
    post.commentCount += 1;
  }

  return comment;
}

/** Nothing pushes to a single-user seed; the mock's own writes already return their result. */
export function subscribeToIssue(): () => void {
  return () => undefined;
}

export const communityApi: CommunityApi = {
  getFeed,
  getIssue,
  getPost: getIssue,
  getComments,
  toggleConfirmation,
  shareIssue,
  postComment,
  subscribeToIssue,
};
