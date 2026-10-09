/** CommunityHub at /hubs/community: the method names, event names and error codes, verbatim. */
// Mirrors CommuntiyService/Communtiy.Shared/Hub/CommunityHubContracts.cs. Rename nothing here
// without the server: an event name that drifts is an event nobody hears, with no error at all.

import { createHubClient, onTokensCleared } from '@/api';
import { HUB_URLS } from '@/config/env';

import type { CommentEventWire, IssueLiveWireHandlers, VoteStateWire } from '../types';

export const HUB_METHODS = {
  sendComment: 'SendComment',
  deleteComment: 'DeleteComment',
  vote: 'VoteIssue',
  share: 'ShareIssue',
  join: 'JoinIssue',
  leave: 'LeaveIssue',
} as const;

export const HUB_EVENTS = {
  commentAdded: 'SendComment',
  commentDeleted: 'DeleteComment',
  voteAdded: 'MakeVote',
  voteRemoved: 'RemoveVote',
  shareAdded: 'MakeShare',
} as const;

/** CommunityHubErrors onto statuses describeError already understands. */
const HUB_ERRORS = {
  unauthenticated: { status: 401 },
  invalid_request: { status: 400 },
  issue_not_found: { status: 404, code: 'ISSUE_NOT_FOUND' },
  comment_not_found: { status: 404 },
  comment_blocked: { status: 422, code: 'COMMENT_REJECTED' },
  moderation_unavailable: { status: 503, code: 'DEPENDENCY_UNAVAILABLE' },
};

/** Issue id to how many screens are watching it; the group is joined once and left at zero. */
const watched = new Map<string, number>();

const hub = createHubClient(HUB_URLS.community, {
  errors: HUB_ERRORS,
  // Groups live on the server's connection, so a reconnect arrives in none of them.
  onConnected: async invoke => {
    await Promise.all(
      [...watched.keys()].map(issueId =>
        invoke(HUB_METHODS.join, issueId).catch(() => undefined),
      ),
    );
  },
});

// The socket was signed as the user who just left; the next one must not inherit it.
onTokensCleared(() => {
  watched.clear();
  hub.reset();
});

export function sendComment(issueId: string, text: string): Promise<CommentEventWire> {
  return hub.invoke<CommentEventWire>(HUB_METHODS.sendComment, { issueId, text });
}

export function toggleVote(issueId: string): Promise<VoteStateWire> {
  return hub.invoke<VoteStateWire>(HUB_METHODS.vote, { issueId });
}

export function shareIssue(issueId: string): Promise<number> {
  return hub.invoke<number>(HUB_METHODS.share, { issueId });
}

type CommentChanged = { comment: CommentEventWire; newCount: number };
type VoteChanged = { vote: { issueId: string; userId: string }; newCount: number };
type ShareChanged = { share: { issueId: string }; newCount: number };

/**
 * Joins the issue's group and routes its events to the handlers until the returned cleanup runs.
 * Events for other issues are dropped here, so a handler only ever sees its own issue.
 */
export function watchIssue(issueId: string, handlers: IssueLiveWireHandlers): () => void {
  const release = hub.retain();

  const count = watched.get(issueId) ?? 0;
  watched.set(issueId, count + 1);
  if (count === 0 && hub.isConnected()) {
    // Not connected yet: onConnected joins it once the start completes.
    hub.invoke(HUB_METHODS.join, issueId).catch(() => undefined);
  }

  const mine = (id: string | undefined) => id?.toLowerCase() === issueId.toLowerCase();

  const subscriptions = [
    hub.on(HUB_EVENTS.commentAdded, payload => {
      const event = payload as CommentChanged;
      if (mine(event?.comment?.issueId)) {
        handlers.onCommentAdded?.(event.comment, event.newCount);
      }
    }),
    hub.on(HUB_EVENTS.commentDeleted, payload => {
      const event = payload as CommentChanged;
      if (mine(event?.comment?.issueId)) {
        handlers.onCommentDeleted?.(event.comment.id, event.newCount);
      }
    }),
    hub.on(HUB_EVENTS.voteAdded, payload => {
      const event = payload as VoteChanged;
      if (mine(event?.vote?.issueId)) {
        handlers.onVotes?.(event.newCount, event.vote.userId, true);
      }
    }),
    hub.on(HUB_EVENTS.voteRemoved, payload => {
      const event = payload as VoteChanged;
      if (mine(event?.vote?.issueId)) {
        handlers.onVotes?.(event.newCount, event.vote.userId, false);
      }
    }),
    hub.on(HUB_EVENTS.shareAdded, payload => {
      const event = payload as ShareChanged;
      if (mine(event?.share?.issueId)) {
        handlers.onShares?.(event.newCount);
      }
    }),
  ];

  let done = false;
  return () => {
    if (done) {
      return;
    }
    done = true;
    subscriptions.forEach(unsubscribe => unsubscribe());

    const remaining = (watched.get(issueId) ?? 1) - 1;
    if (remaining > 0) {
      watched.set(issueId, remaining);
    } else {
      watched.delete(issueId);
      if (hub.isConnected()) {
        hub.invoke(HUB_METHODS.leave, issueId).catch(() => undefined);
      }
    }
    release();
  };
}
