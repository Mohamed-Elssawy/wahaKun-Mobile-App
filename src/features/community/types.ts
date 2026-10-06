// camelCase on the wire from the Web defaults.

import type { MapIssueTier } from '@/features/map/types';
import type { ReportStatus } from '@/features/reports/types';

import type { Coordinates } from './distance';

export type { Coordinates };

/** CommentResponseDto verbatim. The author is an id only; UserService resolves the name. */
export type CommentWire = {
  id: string;
  issueId: string;
  userId: string;
  text: string;
  voiceUrl: string;
  createdAt: string;
};

/** CommentsResponseDto. `count` is the Redis-backed total, not this page's length. */
export type CommentsPageWire = {
  comments: CommentWire[];
  count: number;
};

/**
 * GetIssuesREsponseDto verbatim, from IssueService/Issue.Shared/DTOS/FarmerDtos. The lowercase
 * `userName` is the C# property name, not a rename; FarmerService fills it over gRPC.
 */
// No controller exposes it yet, so nothing constructs this at runtime. It is here so the shape
// the client expects is the shape the backend already wrote, not one invented on this side.
export type FeedItemWire = {
  title: string;
  description: string;
  imageUrl?: string | null;
  issueId: string;
  userId: string;
  /** IssuePriority: 0 Low, 1 Medium, 2 High, 3 Critical. */
  priority: number;
  /** IssueStatus: 0 Reported .. 6 completed. */
  status: number;
  userName: string;
  createdAt: string;
  userPhoto?: string | null;
  commentCount: number;
  voteCount: number;
  shareCount: number;
};

/** PROPOSED. GetIssuesREsponseDto has no such fields, and F-01 draws all three. */
export type FeedItemWireProposed = FeedItemWire & {
  /** Flips the confirm button to its filled state. IIssueVoteRepo.ExistsAsync already knows. */
  hasVoted?: boolean;
  /** For the "0.8 كم" line. GetAllIssues already includes GPSLocation; the DTO drops it. */
  latitude?: string | null;
  longitude?: string | null;
  /** Tells a voice-only issue from a text-only one, which decide different card media. */
  hasVoice?: boolean;
};

/** PaginatedResult<T>. PROPOSED for the feed: GetAllIssuesAsync returns a bare list today. */
export type PaginatedWire<T> = {
  pageIndex: number;
  pageCount: number;
  totalCount: number;
  results: T[];
};

export type Comment = {
  id: string;
  issueId: string;
  authorId: string;
  /** Resolved through UserService; falls back to a placeholder when that call fails. */
  authorName: string;
  authorPicture?: string;
  /** Earns the خبير معتمد badge on F-04. No role reaches the client yet, so always false. */
  isExpert: boolean;
  text: string;
  voiceUrl?: string;
  createdAt: string;
};

export type CommentsPage = {
  comments: Comment[];
  /** Total across all pages, so the header count is right on page one. */
  total: number;
  hasMore: boolean;
};

/** A confirmation's outcome. CommunityController has no vote endpoint yet, so only the mock answers it. */
export type VoteResult = {
  issueId: string;
  hasVoted: boolean;
  voteCount: number;
};

/** One card on F-01. */
export type FeedPost = {
  issueId: string;
  title: string;
  /** The body text under the author row. */
  description?: string;
  photoUrl?: string;
  /** Draws the mic placeholder where the photo goes, so a voice report is not a blank card. */
  hasVoice: boolean;
  status: ReportStatus;
  tier: MapIssueTier;
  createdAt: string;
  latitude?: number;
  longitude?: number;

  /** Resolved to a name through UserService. */
  reporterId?: string;
  reporterName?: string;
  reporterPicture?: string;

  /** "N تأكيدات": IssueVote rows for this issue. */
  confirmations: number;
  commentCount: number;
  shareCount: number;
  /** Whether this farmer has already confirmed it, which flips the button to filled. */
  hasConfirmed: boolean;
};

/** The three underlined tabs. Single-select, and the only axis that filters on status. */
export type FeedTab = 'all' | 'active' | 'resolved';

/** The severity chips. Independent toggles; an empty set means no severity filter at all. */
export type FeedSeverity = 'critical' | 'medium' | 'low';

/** The ترتيب chip's menu. */
export type FeedSort = 'severity' | 'newest' | 'nearest';

export type FeedPage = {
  posts: FeedPost[];
  hasMore: boolean;
};

export type FeedQuery = {
  page: number;
  pageSize: number;
  tab: FeedTab;
  severities: readonly FeedSeverity[];
  /** The قريب مني chip. A filter, not a sort: it can be on while sorting by severity. */
  nearbyOnly: boolean;
  sort: FeedSort;
  /** Required by `nearest` and by nearbyOnly; without it both degrade to no-ops. */
  origin?: Coordinates;
};

/**
 * F-04's community half: everything the card knows, plus the recording. The report itself -
 * the diagnosis, the status track - still comes from reportApi, so a failure in either half
 * leaves the other on screen.
 */
export type IssueDetails = FeedPost & {
  /** The attached recording. No read endpoint returns one, so only the mock fills it. */
  voiceUrl?: string;
  /** PROPOSED. Nothing in the backend holds a transcript, and F-04 draws النص من التسجيل. */
  transcript?: string;
};

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type CommunityApi = {
  getFeed: (query: FeedQuery) => Promise<FeedPage>;
  /** Null rather than a throw when the feed does not list it: F-04 still draws the report. */
  getIssue: (issueId: string) => Promise<IssueDetails | null>;
  /** CommunityHub.ShareIssue. Resolves to the new share count. */
  shareIssue: (issueId: string) => Promise<number>;
  /** CommunityHub.SendComment. Rejects when moderation blocks the text. */
  postComment: (issueId: string, text: string) => Promise<Comment>;
  /** Toggles: a second call undoes the first rather than erroring. */
  toggleConfirmation: (issueId: string) => Promise<VoteResult>;
  getComments: (issueId: string, page: number, pageSize: number) => Promise<CommentsPage>;
  /** One seeded post by id, so F-04 can open a feed card the server has never heard of. */
  getPost: (issueId: string) => Promise<FeedPost | null>;
};
