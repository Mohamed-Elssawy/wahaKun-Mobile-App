// S-06. NotificationService has no route the app has ever found.

/** The taxonomy's rows, with expert-reviewed and case-assigned split since the glyphs differ. */
export type NotificationIconType =
  | 'hazard'
  | 'expertReviewed'
  | 'caseAssigned'
  | 'aiDiagnosis'
  | 'comment'
  | 'scheduling'
  | 'confirmationRequest'
  | 'resolved'
  | 'rejectedReopened';

/** Every non-chat row in the destinations table; the two aggregate-alert rows route unfiltered. */
export type NotificationDestination =
  | { screen: 'ReportTracker'; reportId: string }
  | { screen: 'IssueDetails'; reportId: string }
  | { screen: 'OasisMap' }
  | { screen: 'ExpertCaseReview'; reportId: string; state?: 'reopened' }
  | { screen: 'ExpertCaseClosed'; reportId: string }
  | { screen: 'ExpertInbox' };

export type NotificationItem = {
  id: string;
  type: NotificationIconType;
  title: string;
  /** ISO. Both the group bucket and the time label derive from this one field - see time.ts. */
  createdAt: string;
  isRead: boolean;
  destination: NotificationDestination;
};

export type NotificationPage = {
  items: NotificationItem[];
  hasMore: boolean;
};

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type NotificationApi = {
  getNotifications: (page: number, pageSize: number) => Promise<NotificationPage>;
  markRead: (id: string) => Promise<void>;
  /** Every notification, not just the اليوم group the button sits on. */
  markAllRead: () => Promise<void>;
};
