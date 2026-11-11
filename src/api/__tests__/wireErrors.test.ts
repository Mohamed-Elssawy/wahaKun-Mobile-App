// Mocks fetch, not @/api: parseErrorBody and the 401 retry are invisible above the apiClient seam.

import { withAnalysis } from '@/__fixtures__/wire/caseReview';
import {
  EMPTY_INBOX_BODY,
  FARMER_ISSUES_CRASH_BODY,
  INVALID_OPERATION_BODY,
  ISSUE_NOT_FOUND_BODY,
  PROBLEM_DETAILS_BODY,
  PRODUCTION_EMPTY_BODY,
  RESOLUTION_REFUSAL_BODY,
  REVIEW_REFUSAL_BODY,
  UNAUTHORIZED_BODY,
  UNRELATED_STACK_BODY,
} from '@/__fixtures__/wire/errors';
import { emptyPage, shortPage } from '@/__fixtures__/wire/expertInbox';
import { noAppointmentFields } from '@/__fixtures__/wire/farmerIssues';
import { singleRoleExpert, singleRoleFarmer } from '@/__fixtures__/wire/jwt';
import { API_BASE_URLS } from '@/config/env';
import {
  classifyExpertError,
  confirmRepair,
  getAssignedCases,
  submitReview,
} from '@/features/expert/services/expertService';
import { describeError } from '@/features/reports/errors';
import { getMyReports } from '@/features/reports/services/reportService';

import { API_ENDPOINTS } from '../endpoints';
import { CODE_MESSAGES, STATUS_MESSAGES } from '../errorMessages';
import { getAccessToken, saveTokens } from '../tokenStorage';

import type { ApiError } from '../errors';

// jest.setup's stub never returns what it stored, and the access token is read on every call.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
      setItem: (key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        store.delete(key);
        return Promise.resolve();
      },
      setMany: (entries: Record<string, string>) => {
        Object.entries(entries).forEach(([key, value]) => store.set(key, value));
        return Promise.resolve();
      },
      removeMany: (keys: string[]) => {
        keys.forEach(key => store.delete(key));
        return Promise.resolve();
      },
    },
  };
});

// `global` is not in this project's type set; the binding is the same object jest.setup stubbed.
const fetchMock = fetch as unknown as jest.Mock;

const PHOTO = {
  uri: 'file:///cache/repair.jpg',
  type: 'image/jpeg',
  fileName: 'repair.jpg',
};

// A real Response always carries headers; a stub without them is classified by the wrong rule.
function respond(
  status: number,
  body: string,
  contentType = 'application/json',
): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name === 'content-type' ? contentType : null) },
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
  } as unknown as Response);
}

function route(handler: (url: string) => Promise<Response>): void {
  fetchMock.mockImplementation((url: string) => handler(String(url)));
}

function urlsMatching(pattern: string): string[] {
  return fetchMock.mock.calls
    .map(call => String(call[0]))
    .filter(url => url.includes(pattern));
}

/** The ApiError client.ts built for one raw call, which is what the two matchers are handed. */
async function errorFrom(path: string): Promise<ApiError> {
  const { apiClient } = jest.requireActual('../client') as typeof import('../client');
  return apiClient
    .get(API_BASE_URLS.issue, path, { authenticated: true })
    .then(() => {
      throw new Error('expected the call to fail');
    })
    .catch((error: ApiError) => error);
}

const INBOX = API_ENDPOINTS.issue.inbox(10, 1, 2);

beforeEach(async () => {
  fetchMock.mockReset();
  // logFailure writes one warn per ApiError, and every case here raises at least one.
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  await saveTokens(singleRoleFarmer, 'refresh-1');
});

afterEach(() => jest.restoreAllMocks());

// I7 reads back a clean 200 for an empty inbox, so the branch that turned a 500 into [] is gone.
describe('the empty inbox', () => {
  it('is a 200 with an empty results array, through client.ts', async () => {
    route(() => respond(200, JSON.stringify(emptyPage)));

    await expect(getAssignedCases()).resolves.toEqual([]);
  });

  // The old code swallowed any 500 on page one and returned [], so an outage rendered as no cases.
  it('is not what a page-one failure looks like: that rethrows', async () => {
    route(() => respond(500, EMPTY_INBOX_BODY));

    await expect(getAssignedCases()).rejects.toMatchObject({ status: 500 });
  });

  // C13: the role guard. A farmer's token must produce an error state, never an empty inbox.
  it('is not what the role guard looks like either', async () => {
    route(() => respond(403, PRODUCTION_EMPTY_BODY));

    await expect(getAssignedCases()).rejects.toMatchObject({
      status: 403,
      kind: 'forbidden',
      userMessage: STATUS_MESSAGES[403],
    });
  });

  // A network failure on page one is the third way the old branch could lie about an empty inbox.
  it('is not what an unreachable server looks like either', async () => {
    route(() => Promise.reject(new TypeError('Network request failed')));

    await expect(getAssignedCases()).rejects.toMatchObject({ isNetworkError: true });
  });
});

describe('a real crash', () => {
  // A 500 WITH a body is not shape D, so it is never read as a non-assignment refusal.
  it('is not a refusal, however its text reads', async () => {
    route(() => respond(500, UNRELATED_STACK_BODY));

    const error = await errorFrom(INBOX);

    expect(error.details.serverMessage).toContain('NullReferenceException');
    expect(classifyExpertError(error)).toBe('unknown');
  });

  it('rethrows out of getAssignedCases', async () => {
    route(() => respond(500, UNRELATED_STACK_BODY));

    await expect(getAssignedCases()).rejects.toMatchObject({ status: 500 });
  });

  // F1: the cast of List<Guid?> to IEnumerable<Guid> throws on every call to the farmer's list.
  it('reaches بلاغاتي as the error state, which is what F1 serves today', async () => {
    route(() => respond(500, FARMER_ISSUES_CRASH_BODY));

    await expect(getMyReports()).rejects.toMatchObject({
      status: 500,
      userMessage: STATUS_MESSAGES[500],
    });
  });
});

// UNVERIFIED: no write was ever exercised, so a status-guard refusal has never been seen.
describe('the refusals that are really conflicts', () => {
  // I5's shape. With no code to read, the rebuilt 409 falls to STATUS_MESSAGES[409].
  it('reads the review refusal as a 409 from an empty 500', async () => {
    route(() => respond(500, PRODUCTION_EMPTY_BODY));

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({
      status: 409,
      kind: 'conflict',
      userMessage: STATUS_MESSAGES[409],
    });
  });

  // When the server names a reason its code wins, which is the code-first rule paying out.
  it('keeps the server-named reason when the refusal carries a code', async () => {
    route(() => respond(400, INVALID_OPERATION_BODY));

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({
      status: 409,
      kind: 'conflict',
      code: 'INVALID_OPERATION',
      userMessage: CODE_MESSAGES.INVALID_OPERATION,
    });
  });

  it('reads the resolution refusal as a 409 too', async () => {
    route(() => respond(500, PRODUCTION_EMPTY_BODY));

    await expect(
      confirmRepair({ reportId: 'issue-1', photo: PHOTO, notes: 'ملاحظة' }),
    ).rejects.toMatchObject({ status: 409, userMessage: STATUS_MESSAGES[409] });
  });

  // Regression guard: both carry the phrase isServerRefusal matched on, and neither may become a 409.
  it.each([
    ['the review phrase with a stack', REVIEW_REFUSAL_BODY],
    ['the resolution phrase with a stack', RESOLUTION_REFUSAL_BODY],
  ])('does not turn %s into a conflict', async (_name, body) => {
    route(() => respond(500, body));

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({
      status: 500,
      userMessage: STATUS_MESSAGES[500],
    });
  });

  // A missing row is not a guard refusal: a 409 would tell the expert to stop when the case is gone.
  it('does not turn a missing row into a conflict', async () => {
    route(() => respond(404, ISSUE_NOT_FOUND_BODY));

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({
      status: 404,
      code: 'ISSUE_NOT_FOUND',
      userMessage: CODE_MESSAGES.ISSUE_NOT_FOUND,
    });
  });
});

// An empty body crashes nothing, and a page-one failure is an error rather than an empty list.
describe('what the deployment actually returns', () => {
  it('crashes nothing on an empty body', async () => {
    route(() => respond(500, PRODUCTION_EMPTY_BODY));

    const error = await errorFrom(INBOX);

    expect(error.status).toBe(500);
    expect(error.details.serverMessage).toBeUndefined();
    expect(error.details.body).toBeNull();
    // I5's shape, which is the one the whole classifier turns on.
    expect(classifyExpertError(error)).toBe('notAssigned');
  });

  it('reads an empty 500 on the inbox as a failure, not as an empty inbox', async () => {
    route(() => respond(500, PRODUCTION_EMPTY_BODY));

    await expect(getAssignedCases()).rejects.toMatchObject({
      status: 500,
      userMessage: STATUS_MESSAGES[500],
    });
  });

  // The empty 500 is what I5 observed, so the refusal is read by shape and the 409 copy is reachable.
  it('now recognises the review refusal in that same empty 500', async () => {
    route(() => respond(500, PRODUCTION_EMPTY_BODY));

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({
      status: 409,
      userMessage: STATUS_MESSAGES[409],
    });
  });
});

// Shape C, I3: a model-binding failure is a different family from a domain refusal.
describe('a model-binding failure', () => {
  it('is a validation error, not a refusal', async () => {
    route(() => respond(400, PROBLEM_DETAILS_BODY));

    const error = await errorFrom(INBOX);

    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.details.fieldErrors).toEqual({
      Critical: ["The value 'notanenum' is not valid for Critical."],
    });
    expect(classifyExpertError(error)).toBe('unknown');
  });
});

describe('a 401 on an authenticated call', () => {
  it('refreshes once and retries the request', async () => {
    let inboxCalls = 0;
    route(url => {
      if (url.includes(API_ENDPOINTS.auth.refreshToken)) {
        return respond(
          200,
          JSON.stringify({ accessToken: singleRoleExpert, refreshToken: 'refresh-2' }),
        );
      }
      if (url.includes('/Expert/inbox')) {
        inboxCalls += 1;
        return inboxCalls === 1
          ? respond(401, UNAUTHORIZED_BODY)
          : respond(200, JSON.stringify(shortPage));
      }
      return respond(200, JSON.stringify(withAnalysis));
    });

    const cases = await getAssignedCases();

    expect(urlsMatching(API_ENDPOINTS.auth.refreshToken)).toHaveLength(1);
    expect(inboxCalls).toBe(2);
    expect(cases).toHaveLength(3);
  });

  // isRetry stops the second 401 looping, and the session is then expired rather than retried.
  it('gives up rather than looping when the refresh is refused', async () => {
    route(url =>
      url.includes(API_ENDPOINTS.auth.refreshToken)
        ? respond(400, '{"code":"INVALID_REFRESH_TOKEN"}')
        : respond(401, UNAUTHORIZED_BODY),
    );

    await expect(getMyReports()).rejects.toMatchObject({ status: 401 });
    expect(urlsMatching(API_ENDPOINTS.auth.refreshToken)).toHaveLength(1);
  });

  // The server really did refuse the refresh token, so the session is over: tokens cleared.
  it('ends the session when the server refuses the refresh', async () => {
    route(url =>
      url.includes(API_ENDPOINTS.auth.refreshToken)
        ? respond(400, '{"code":"INVALID_REFRESH_TOKEN"}')
        : respond(401, UNAUTHORIZED_BODY),
    );

    await expect(getMyReports()).rejects.toMatchObject({ status: 401 });
    await expect(getAccessToken()).resolves.toBeNull();
  });

  // D11: a network outcome once called expireSession, logging the farmer out by their own connection.
  describe('a refresh the network never delivered (D11)', () => {
    /** Refresh throws, as fetch does with no connection; the original call still 401s. */
    const refreshUnreachable = () =>
      route(url =>
        url.includes(API_ENDPOINTS.auth.refreshToken)
          ? Promise.reject(new TypeError('Network request failed'))
          : respond(401, UNAUTHORIZED_BODY),
      );

    it('leaves the farmer signed in', async () => {
      refreshUnreachable();

      await expect(getMyReports()).rejects.toBeDefined();

      // The whole point: the tokens are still there, so no screen sends them to login.
      await expect(getAccessToken()).resolves.toBe(singleRoleFarmer);
    });

    it('raises a network error, not an auth expiry', async () => {
      refreshUnreachable();

      const error = await getMyReports().catch((raised: ApiError) => raised);

      // The truthful statement is that the server could not be reached, which makes the queue back off.
      expect((error as ApiError).isNetworkError).toBe(true);
      expect((error as ApiError).isUnauthorized).toBe(false);
    });

    it('still only tries the refresh once', async () => {
      refreshUnreachable();

      await expect(getMyReports()).rejects.toBeDefined();

      expect(urlsMatching(API_ENDPOINTS.auth.refreshToken)).toHaveLength(1);
    });

    // A gateway answering for a service it could not reach never saw the token.
    it('treats a 503 from the gateway the same way', async () => {
      route(url =>
        url.includes(API_ENDPOINTS.auth.refreshToken)
          ? respond(503, '')
          : respond(401, UNAUTHORIZED_BODY),
      );

      await expect(getMyReports()).rejects.toMatchObject({ isNetworkError: true });
      await expect(getAccessToken()).resolves.toBe(singleRoleFarmer);
    });

    // ERR_NGROK_3200's offline page: a 404 of text/html. The tunnel dropping is not a logout.
    it('treats an HTML error page from the tunnel the same way', async () => {
      route(url =>
        url.includes(API_ENDPOINTS.auth.refreshToken)
          ? respond(404, '"<!DOCTYPE html>"', 'text/html; charset=utf-8')
          : respond(401, UNAUTHORIZED_BODY),
      );

      await expect(getMyReports()).rejects.toMatchObject({ isNetworkError: true });
      await expect(getAccessToken()).resolves.toBe(singleRoleFarmer);
    });
  });

  // P20: on this backend an empty 500 from refresh is how every session ends, not an outage.
  describe('the empty 500 a dead refresh token really answers', () => {
    const deadSession = () =>
      route(url =>
        url.includes(API_ENDPOINTS.auth.refreshToken)
          ? respond(500, '')
          : respond(401, UNAUTHORIZED_BODY),
      );

    it('ends the session rather than claiming the phone is offline', async () => {
      deadSession();

      await expect(getMyReports()).rejects.toMatchObject({ isUnauthorized: true });
      await expect(getAccessToken()).resolves.toBeNull();
    });

    it('hands the queue unauthorized, which pauses it for the login that is needed', async () => {
      deadSession();

      const error = await getMyReports().catch((raised: unknown) => raised);

      expect(describeError(error, 'fallback').kind).toBe('unauthorized');
    });
  });
});

// A refresh that never reached the server backs off; pausing is for a token the server rejected.
describe('what the queue is handed for each refresh outcome', () => {
  it('reads an unreachable refresh as offline, which retries', async () => {
    route(url =>
      url.includes(API_ENDPOINTS.auth.refreshToken)
        ? Promise.reject(new TypeError('Network request failed'))
        : respond(401, UNAUTHORIZED_BODY),
    );

    const error = await getMyReports().catch((raised: unknown) => raised);

    expect(describeError(error, 'fallback').kind).toBe('offline');
  });

  it('still reads a refused refresh as unauthorized, which pauses', async () => {
    route(url =>
      url.includes(API_ENDPOINTS.auth.refreshToken)
        ? respond(400, '{"code":"INVALID_REFRESH_TOKEN"}')
        : respond(401, UNAUTHORIZED_BODY),
    );

    const error = await getMyReports().catch((raised: unknown) => raised);

    expect(describeError(error, 'fallback').kind).toBe('unauthorized');
  });
});

// The happy path through the same seam, so an apiClient mock is not the only evidence it parses.
describe('the success bodies through client.ts', () => {
  it('parses the inbox and the farmer list off real JSON text', async () => {
    route(url =>
      url.includes('/Expert/inbox')
        ? respond(200, JSON.stringify(shortPage))
        : respond(200, JSON.stringify(withAnalysis)),
    );

    expect(await getAssignedCases()).toHaveLength(3);

    route(() => respond(200, JSON.stringify(noAppointmentFields)));

    expect((await getMyReports())[0].id).toBe('i-1');
  });
});
