import { communityApi, isServerIssueId } from '../services/communityService';

const mockGet = jest.fn();

jest.mock('@/api', () => ({
  apiClient: { get: (...args: unknown[]) => mockGet(...args) },
  API_ENDPOINTS: jest.requireActual('@/api/endpoints').API_ENDPOINTS,
}));

jest.mock('@/features/user/services/userService', () => ({
  getUserDetails: () => Promise.resolve({ fullName: 'سيد حسن' }),
  resolveProfilePictureUrl: (url: string) => url,
}));

const ISSUE_ID = '3f2b8c1e-5d4a-4b7e-9c2a-1e6f8d0a7b3c';

beforeEach(() => mockGet.mockReset());

// CommunityController declares GetCommentsByIssueId and nothing else.
describe('communityService', () => {
  it('serves the feed from the seed and never calls the server for it', async () => {
    const page = await communityApi.getFeed({ page: 1, pageSize: 10, filter: 'all' });

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
    const page = await communityApi.getComments('i-1043', 1, 10);

    expect(mockGet).not.toHaveBeenCalled();
    expect(page.comments.length).toBeGreaterThan(0);
  });

  it('tells Guids from seed ids', () => {
    expect(isServerIssueId(ISSUE_ID)).toBe(true);
    expect(isServerIssueId('i-1043')).toBe(false);
  });
});
