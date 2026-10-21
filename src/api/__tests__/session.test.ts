import { refreshSessionOutcome } from '../session';

const mockGetRefreshToken = jest.fn<Promise<string | null>, []>();
const mockSaveTokens = jest.fn<Promise<void>, [string, string]>();

jest.mock('../tokenStorage', () => ({
  getAccessToken: jest.fn().mockResolvedValue(null),
  getRefreshToken: () => mockGetRefreshToken(),
  saveTokens: (access: string, refresh: string) => mockSaveTokens(access, refresh),
  clearTokens: jest.fn().mockResolvedValue(undefined),
}));

const mockFetch = jest.fn();

/** `fetch`'s shape, down to the one header the outage branch reads. */
function respond(
  status: number,
  body: unknown = '',
  contentType = 'application/json',
): Promise<unknown> {
  return Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => (name === 'content-type' ? contentType : null) },
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  mockGetRefreshToken.mockReset();
  mockSaveTokens.mockReset();
  mockFetch.mockReset();
  mockGetRefreshToken.mockResolvedValue('refresh-token-in-hand');
  mockSaveTokens.mockResolvedValue(undefined);
  (globalThis as { fetch?: unknown }).fetch = mockFetch;
});

describe('POST /Auth/Refresh-Token, what each answer means', () => {
  it('renews the session when both tokens come back', async () => {
    mockFetch.mockReturnValue(
      respond(200, { accessToken: 'new-access', refreshToken: 'new-refresh' }),
    );

    await expect(refreshSessionOutcome()).resolves.toBe('refreshed');
    expect(mockSaveTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
  });

  // RefreshTokenAsync throws a bare Exception, so the normal end of a session here is an empty 500.
  it('ends the session on the empty 500 a dead refresh token really answers', async () => {
    mockFetch.mockReturnValue(respond(500));

    await expect(refreshSessionOutcome()).resolves.toBe('refused');
  });

  it('ends the session on a 4xx, as it always did', async () => {
    mockFetch.mockReturnValue(respond(401));

    await expect(refreshSessionOutcome()).resolves.toBe('refused');
  });

  // A gateway answering for a service it could not reach has no verdict about the token.
  it.each([502, 503, 504])(
    'keeps the session through a %i from the gateway',
    async status => {
      mockFetch.mockReturnValue(respond(status));

      await expect(refreshSessionOutcome()).resolves.toBe('network');
    },
  );

  // AuthService answers JSON or nothing, so HTML means a proxy is talking and not a logout.
  it('keeps the session when an HTML error page answers instead of the service', async () => {
    mockFetch.mockReturnValue(
      respond(404, '<!DOCTYPE html>', 'text/html; charset=utf-8'),
    );

    await expect(refreshSessionOutcome()).resolves.toBe('network');
  });

  it('keeps the session when the request never completes', async () => {
    mockFetch.mockRejectedValue(new Error('Network request failed'));

    await expect(refreshSessionOutcome()).resolves.toBe('network');
  });

  it('refuses without calling the server when there is no refresh token', async () => {
    mockGetRefreshToken.mockResolvedValue(null);

    await expect(refreshSessionOutcome()).resolves.toBe('refused');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // A half-saved session is worse than none: the next call would sign with a token nothing can renew.
  it('refuses a 200 that carries only one of the two tokens', async () => {
    mockFetch.mockReturnValue(respond(200, { accessToken: 'only-access' }));

    await expect(refreshSessionOutcome()).resolves.toBe('refused');
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });

  // Single-flight: a refresh token is single-use, so two concurrent 401s must not spend it twice.
  it('shares one request between concurrent callers', async () => {
    mockFetch.mockReturnValue(
      respond(200, { accessToken: 'new-access', refreshToken: 'new-refresh' }),
    );

    const [first, second] = await Promise.all([
      refreshSessionOutcome(),
      refreshSessionOutcome(),
    ]);

    expect([first, second]).toEqual(['refreshed', 'refreshed']);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
