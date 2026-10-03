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

/** Typing services/index.ts as this is what stops an implementation drifting from the contract. */
export type CommunityApi = {
  getComments: (issueId: string, page: number, pageSize: number) => Promise<CommentsPage>;
};
