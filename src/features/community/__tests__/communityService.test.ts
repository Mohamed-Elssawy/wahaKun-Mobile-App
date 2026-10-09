import { communityApi, isServerIssueId } from '../services/communityService';

const mockGet = jest.fn();

jest.mock('@/api', () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args) },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
  getTokenUserId: () => Promise.resolve('A1B2C3D4-0000-0000-0000-000000000001'),
}));

const mockHub = {
  sendComment: jest.fn(),
  toggleVote: jest.fn(),
  shareIssue: jest.fn(),
  watchIssue: jest.fn(),
};
// Lazy: the factory runs when the import is hoisted, before mockHub is initialised.
jest.mock('../services/communityHub', () => ({
  sendComment: (...args: unknown[]) => mockHub.sendComment(...args),
  toggleVote: (...args: unknown[]) => mockHub.toggleVote(...args),
  shareIssue: (...args: unknown[]) => mockHub.shareIssue(...args),
  watchIssue: (...args: unknown[]) => mockHub.watchIssue(...args),
}));

jest.mock('@/features/user/services/userService', () => ({
  getUserDetails: () => Promise.resolve({ fullName: 'سيد حسن' }),
  resolveProfilePictureUrl: (url: string) => url,
}));

const ISSUE_ID = '3f2b8c1e-5d4a-4b7e-9c2a-1e6f8d0a7b3c';

beforeEach(() => {
  mockGet.mockReset();
  Object.values(mockHub).forEach(fn => fn.mockReset());
});

const flush = () => new Promise<void>(resolve => setImmediate(() => resolve()));

// CommunityController declares GetCommentsByIssueId and nothing else.
describe('communityService', () => {
  it('serves the feed from the seed and never calls the server for it', async () => {
    const page = await communityApi.getFeed({
      page: 1,
      pageSize: 10,
      tab: 'all',
      severities: [],
      nearbyOnly: false,
      sort: 'newest',
    });

    expect(page.posts.length).toBeGreaterThan(0);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('reads a real issue thread from GetCommentsByIssueId', async () => {
    mockGet.mockResolvedValue({
      comments: [
        {
          id: 'c1',
          issueId: ISSUE_ID,
          userId: 'u1',
          text: 'نفس المشكلة عندي',
          voiceUrl: '',
          createdAt: '2026-10-03T10:00:00',
        },
      ],
      count: 1,
    });

    const page = await communityApi.getComments(ISSUE_ID, 1, 10);

    expect(mockGet).toHaveBeenCalledWith(
      expect.any(String),
      `/Community/GetCommentsByIssueId?issueId=${ISSUE_ID}&page=1&pageSize=10`,
      { authenticated: true },
    );
    expect(page.comments[0].authorName).toBe('سيد حسن');
    expect(page.total).toBe(1);
  });

  it('keeps a seeded card on the seed, since its id would bind to no Guid', async () => {
    const page = await communityApi.getComments('1043', 1, 10);

    expect(mockGet).not.toHaveBeenCalled();
    expect(page.comments.length).toBeGreaterThan(0);
  });

  it('tells Guids from seed ids', () => {
    expect(isServerIssueId(ISSUE_ID)).toBe(true);
    expect(isServerIssueId('1043')).toBe(false);
  });

  describe('CommunityHub writes', () => {
    it('posts a comment through SendComment and names its author', async () => {
      mockHub.sendComment.mockResolvedValue({
        id: 'c9',
        issueId: ISSUE_ID,
        userId: 'u1',
        text: 'نفس المشكلة عندي',
        voiceUrl: null,
        createdAt: '2026-10-09T08:00:00',
      });

      const comment = await communityApi.postComment(ISSUE_ID, 'نفس المشكلة عندي');

      expect(mockHub.sendComment).toHaveBeenCalledWith(ISSUE_ID, 'نفس المشكلة عندي');
      expect(comment).toMatchObject({ id: 'c9', authorName: 'سيد حسن', voiceUrl: undefined });
      // datetime2 carries no offset; read as local it would shift by the phone's zone.
      expect(comment.createdAt).toBe('2026-10-09T08:00:00Z');
    });

    it('maps VoteStateDto onto VoteResult', async () => {
      mockHub.toggleVote.mockResolvedValue({ issueId: ISSUE_ID, hasVoted: true, count: 4 });

      await expect(communityApi.toggleConfirmation(ISSUE_ID)).resolves.toEqual({
        issueId: ISSUE_ID,
        hasVoted: true,
        voteCount: 4,
      });
    });

    it('shares through ShareIssue and resolves to the new count', async () => {
      mockHub.shareIssue.mockResolvedValue(7);

      await expect(communityApi.shareIssue(ISSUE_ID)).resolves.toBe(7);
    });

    it('lets a hub refusal reach the caller untouched', async () => {
      const refusal = new Error('blocked');
      mockHub.sendComment.mockRejectedValue(refusal);

      await expect(communityApi.postComment(ISSUE_ID, 'x')).rejects.toBe(refusal);
    });

    it('keeps every write for a seeded issue on the mock', async () => {
      await communityApi.toggleConfirmation('1043');
      await communityApi.shareIssue('1043');

      expect(mockHub.toggleVote).not.toHaveBeenCalled();
      expect(mockHub.shareIssue).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToIssue', () => {
    it('does not open the hub for a seeded issue', () => {
      const stop = communityApi.subscribeToIssue('1043', jest.fn());

      expect(mockHub.watchIssue).not.toHaveBeenCalled();
      expect(stop).not.toThrow();
    });

    it('turns hub events into domain events, telling my vote from another farmer', async () => {
      const unwatch = jest.fn();
      mockHub.watchIssue.mockReturnValue(unwatch);
      const listener = jest.fn();

      const stop = communityApi.subscribeToIssue(ISSUE_ID, listener);
      const handlers = mockHub.watchIssue.mock.calls[0][1];

      handlers.onCommentAdded(
        { id: 'c2', issueId: ISSUE_ID, userId: 'u1', text: 'تمام', voiceUrl: null, createdAt: '2026-10-09T08:00:00' },
        3,
      );
      handlers.onCommentDeleted('c1', 2);
      // Same guid as the token's, in another case: SQL Server and .NET disagree on casing.
      handlers.onVotes(5, 'a1b2c3d4-0000-0000-0000-000000000001', true);
      handlers.onVotes(6, 'ffffffff-0000-0000-0000-000000000009', true);
      handlers.onShares(2);
      await flush();

      expect(listener.mock.calls.map(([event]) => event)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'commentAdded', total: 3, comment: expect.objectContaining({ id: 'c2', authorName: 'سيد حسن' }) }),
          { type: 'commentDeleted', commentId: 'c1', total: 2 },
          { type: 'votes', count: 5, voted: true, byMe: true },
          { type: 'votes', count: 6, voted: true, byMe: false },
          { type: 'shares', count: 2 },
        ]),
      );

      stop();
      expect(unwatch).toHaveBeenCalledTimes(1);
    });
  });
});
