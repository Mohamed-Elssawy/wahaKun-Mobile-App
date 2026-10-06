import {
  getComments,
  getFeed,
  postComment,
  shareIssue,
  toggleConfirmation,
} from '../services/communityService.mock';

import type { FeedQuery } from '../types';

/** The mock simulates latency: 700ms for the feed, 500ms for comments, 400ms for a write. */
const TIMEOUT = 20_000;

const query = (overrides: Partial<FeedQuery> = {}): FeedQuery => ({
  page: 1,
  pageSize: 2,
  tab: 'all',
  severities: [],
  nearbyOnly: false,
  sort: 'newest',
  ...overrides,
});

describe('feed pagination', () => {
  it(
    'reports more pages while any remain',
    async () => {
      const first = await getFeed(query());

      expect(first.posts).toHaveLength(2);
      expect(first.hasMore).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'stops at the last page rather than repeating it',
    async () => {
      const last = await getFeed(query({ page: 4 }));

      expect(last.hasMore).toBe(false);
      const first = await getFeed(query());
      // The ids must not overlap, or an infinite scroll would loop forever.
      const ids = new Set(first.posts.map(post => post.issueId));
      expect(last.posts.every(post => !ids.has(post.issueId))).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'returns nothing past the end',
    async () => {
      const beyond = await getFeed(query({ page: 99 }));

      expect(beyond.posts).toEqual([]);
      expect(beyond.hasMore).toBe(false);
    },
    TIMEOUT,
  );
});

describe('feed tabs', () => {
  it(
    'separates resolved from active with nothing in both',
    async () => {
      const resolved = await getFeed(query({ tab: 'resolved', pageSize: 20 }));
      const active = await getFeed(query({ tab: 'active', pageSize: 20 }));

      const resolvedIds = new Set(resolved.posts.map(post => post.issueId));
      expect(resolved.posts.length).toBeGreaterThan(0);
      expect(active.posts.length).toBeGreaterThan(0);
      expect(active.posts.every(post => !resolvedIds.has(post.issueId))).toBe(true);
    },
    TIMEOUT,
  );
});

describe('severity chips', () => {
  it(
    'treats no chips as no filter rather than as matching nothing',
    async () => {
      const none = await getFeed(query({ severities: [], pageSize: 20 }));
      const all = await getFeed(query({ pageSize: 20 }));

      expect(none.posts).toHaveLength(all.posts.length);
    },
    TIMEOUT,
  );

  it(
    'narrows to one severity',
    async () => {
      const { posts } = await getFeed(query({ severities: ['critical'], pageSize: 20 }));

      expect(posts.length).toBeGreaterThan(0);
      expect(posts.every(post => post.tier === 'critical')).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'unions the chips rather than intersecting them',
    async () => {
      const critical = await getFeed(query({ severities: ['critical'], pageSize: 20 }));
      const medium = await getFeed(query({ severities: ['medium'], pageSize: 20 }));
      const both = await getFeed(
        query({ severities: ['critical', 'medium'], pageSize: 20 }),
      );

      expect(both.posts).toHaveLength(critical.posts.length + medium.posts.length);
    },
    TIMEOUT,
  );
});

describe('sorting and proximity', () => {
  const origin = { latitude: 29.2041, longitude: 25.5195 };

  it(
    'puts the nearest issue first when sorting by distance',
    async () => {
      const { posts } = await getFeed(query({ sort: 'nearest', pageSize: 20, origin }));

      // The seed's closest post is the canal leak a few hundred metres away.
      expect(posts[0].issueId).toBe('1043');
    },
    TIMEOUT,
  );

  it(
    'puts critical first when sorting by severity',
    async () => {
      const { posts } = await getFeed(query({ sort: 'severity', pageSize: 20 }));

      expect(posts[0].tier).toBe('critical');
    },
    TIMEOUT,
  );

  it(
    'drops issues with no fix from the nearby filter, and keeps them without it',
    async () => {
      const near = await getFeed(query({ nearbyOnly: true, pageSize: 20, origin }));
      const everything = await getFeed(query({ pageSize: 20 }));

      // i-1049 carries no coordinates at all.
      expect(everything.posts.some(post => post.issueId === '1049')).toBe(true);
      expect(near.posts.some(post => post.issueId === '1049')).toBe(false);
    },
    TIMEOUT,
  );

  it(
    'ignores the nearby filter without a fix rather than emptying the feed',
    async () => {
      const withoutOrigin = await getFeed(query({ nearbyOnly: true, pageSize: 20 }));

      expect(withoutOrigin.posts.length).toBeGreaterThan(0);
    },
    TIMEOUT,
  );
});

describe('comments', () => {
  it(
    'pages a thread and keeps the total across pages',
    async () => {
      const first = await getComments('1043', 1, 2);

      expect(first.comments).toHaveLength(2);
      // total is every comment, not this page's length, or the header count is wrong.
      expect(first.total).toBeGreaterThan(2);
      expect(first.hasMore).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'has an expert reply, which is what earns the badge on F-04',
    async () => {
      const { comments } = await getComments('1043', 1, 20);

      expect(comments.some(comment => comment.isExpert)).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'returns an empty thread rather than throwing for an issue with none',
    async () => {
      const page = await getComments('i-nothing-here', 1, 20);

      expect(page.comments).toEqual([]);
      expect(page.total).toBe(0);
      expect(page.hasMore).toBe(false);
    },
    TIMEOUT,
  );
});

describe('writes', () => {
  it(
    'toggles a vote off again rather than counting it twice',
    async () => {
      const on = await toggleConfirmation('1045');
      expect(on.hasVoted).toBe(true);

      const off = await toggleConfirmation('1045');
      expect(off.hasVoted).toBe(false);
      expect(off.voteCount).toBe(on.voteCount - 1);
    },
    TIMEOUT,
  );

  it(
    'removes the vote the seed already holds instead of adding another',
    async () => {
      // i-1044 starts confirmed, which is the frame's filled button.
      const first = await toggleConfirmation('1044');

      expect(first.hasVoted).toBe(false);
      await toggleConfirmation('1044');
    },
    TIMEOUT,
  );

  it(
    'only ever increments a share, because the hub has no un-share',
    async () => {
      const before = await shareIssue('1046');
      const after = await shareIssue('1046');

      expect(after).toBe(before + 1);
    },
    TIMEOUT,
  );

  it(
    'appends a posted comment to the thread it belongs to',
    async () => {
      const posted = await postComment('1050', 'شكراً على المتابعة.');
      const { comments } = await getComments('1050', 1, 20);

      expect(posted.isExpert).toBe(false);
      expect(comments.map(comment => comment.id)).toContain(posted.id);
    },
    TIMEOUT,
  );
});
