import { getComments, getFeed } from '../services/communityService.mock';

/** The mock simulates latency: 700ms for the feed, 500ms for comments. */
const TIMEOUT = 20_000;

const query = (overrides = {}) => ({
  page: 1,
  pageSize: 2,
  filter: 'all' as const,
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
      const second = await getFeed(query({ page: 2 }));

      expect(second.hasMore).toBe(false);
      const first = await getFeed(query());
      // The ids must not overlap, or an infinite scroll would loop forever.
      const ids = new Set(first.posts.map(post => post.issueId));
      expect(second.posts.every(post => !ids.has(post.issueId))).toBe(true);
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

describe('feed filters', () => {
  it(
    'narrows to critical posts',
    async () => {
      const { posts } = await getFeed(query({ filter: 'critical', pageSize: 20 }));

      expect(posts.length).toBeGreaterThan(0);
      expect(posts.every(post => post.tier === 'critical')).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'separates resolved from in-progress with nothing in both',
    async () => {
      const resolved = await getFeed(query({ filter: 'resolved', pageSize: 20 }));
      const active = await getFeed(query({ filter: 'inProgress', pageSize: 20 }));

      const resolvedIds = new Set(resolved.posts.map(post => post.issueId));
      expect(active.posts.every(post => !resolvedIds.has(post.issueId))).toBe(true);
      expect(resolved.posts.length).toBeGreaterThan(0);
    },
    TIMEOUT,
  );

  it(
    'sorts nearby by distance from the farmer',
    async () => {
      const origin = { latitude: 29.2041, longitude: 25.5195 };
      const { posts } = await getFeed(query({ filter: 'nearby', pageSize: 20, origin }));

      // The seed's closest post is the canal leak a few hundred metres away.
      expect(posts[0].issueId).toBe('i-1043');
    },
    TIMEOUT,
  );
});

describe('comments', () => {
  it(
    'pages a thread and keeps the total across pages',
    async () => {
      const first = await getComments('i-1043', 1, 2);

      expect(first.comments).toHaveLength(2);
      // total is every comment, not this page's length, or the header count is wrong.
      expect(first.total).toBe(4);
      expect(first.hasMore).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'has an expert reply, which is what earns the badge on F-04',
    async () => {
      const { comments } = await getComments('i-1043', 1, 20);

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
