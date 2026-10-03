// camelCase on the wire from the Web defaults.

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

export type Comment = {
  id: string;
  issueId: string;
  authorId: string;
  /** Resolved through UserService; falls back to a placeholder when that call fails. */
  authorName: string;
  authorPicture?: string;
  /** Experts get a badge on F-04. No role reaches the client yet, so this is always false. */
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
  /** Whether this farmer has already confirmed it, which flips the button's state. */
  hasConfirmed: boolean;
};

export type FeedFilter = 'all' | 'critical' | 'nearby' | 'inProgress' | 'resolved';

export type FeedPage = {
  posts: FeedPost[];
  hasMore: boolean;
};

export type FeedQuery = {
  page: number;
  pageSize: number;
  filter: FeedFilter;
  /** Only used by the `nearby` filter, which sorts by distance from here. */
  origin?: { latitude: number; longitude: number };
};

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type CommunityApi = {
  getFeed: (query: FeedQuery) => Promise<FeedPage>;
  toggleConfirmation: (issueId: string) => Promise<VoteResult>;
  getComments: (issueId: string, page: number, pageSize: number) => Promise<CommentsPage>;
  /** One seeded post by id, so F-04 can open a feed card the server has never heard of. */
  getPost: (issueId: string) => Promise<FeedPost | null>;
};
