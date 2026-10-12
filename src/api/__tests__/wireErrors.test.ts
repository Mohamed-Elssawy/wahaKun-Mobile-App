/**
 * The only suite in the repo that mocks `fetch` rather than `@/api`, and it has to stay that
 * way. `client.ts` is what is under test here: it owns `parseErrorBody`, which turns the
 * plain-text exception IssueService returns into `details.serverMessage`, and it owns the 401
 * refresh-and-retry. Neither can be proven above the apiClient seam, so unifying this suite
 * with the mapper suites would delete the coverage without failing a single test.
 */

import { withAnalysis } from '@/__fixtures__/wire/caseReview';
import {
  EMPTY_INBOX_BODY,
  FARMER_ISSUES_CRASH_BODY,
  PRODUCTION_EMPTY_BODY,
  RESOLUTION_REFUSAL_BODY,
  REVIEW_REFUSAL_BODY,
  UNAUTHORIZED_BODY,
  UNRELATED_STACK_BODY,
} from '@/__fixtures__/wire/errors';
import { shortPage } from '@/__fixtures__/wire/expertInbox';
import { withAppointment } from '@/__fixtures__/wire/farmerIssues';
import { singleRoleExpert, singleRoleFarmer } from '@/__fixtures__/wire/jwt';
import { API_BASE_URLS } from '@/config/env';
import {
  confirmRepair,
  getAssignedCases,
  isEmptyResultError,
  isServerRefusal,
  submitReview,
} from '@/features/expert/services/expertService';
import { getMyReports } from '@/features/reports/services/reportService';

import { API_ENDPOINTS } from '../endpoints';
import { STATUS_MESSAGES } from '../errorMessages';
import { saveTokens } from '../tokenStorage';

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

const PHOTO = { uri: 'file:///cache/repair.jpg', type: 'image/jpeg', fileName: 'repair.jpg' };

/** What client.ts reads off a Response, plus the `json()` session.ts's refresh call uses. */
function respond(status: number, body: string): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
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

/**
 * KeyNotFoundException("No issues were found.") on an empty inbox - §4.2 note 2, F4. It means
 * EMPTY, not ERROR: read as an error, a new expert's first screen is red.
 */
describe('the empty inbox', () => {
  it('carries the exception message through parseErrorBody', async () => {
    route(() => respond(500, EMPTY_INBOX_BODY));

    const error = await errorFrom(INBOX);

    expect(error.status).toBe(500);
    expect(error.details.serverMessage).toContain('No issues were found');
    // Sliced to 300 characters, and the message is at the head, so the match survives a long stack.
    expect(EMPTY_INBOX_BODY.length).toBeGreaterThan(300);
    expect(error.details.serverMessage).toHaveLength(300);
    expect(isEmptyResultError(error)).toBe(true);
  });

  it('reaches getAssignedCases as an empty list', async () => {
    route(() => respond(500, EMPTY_INBOX_BODY));

    await expect(getAssignedCases()).resolves.toEqual([]);
  });
});

describe('a real crash', () => {
  // Both halves are required, so an outage is never mistaken for an empty result or a refusal.
  it('is neither an empty result nor a refusal', async () => {
    route(() => respond(500, UNRELATED_STACK_BODY));

    const error = await errorFrom(INBOX);

    expect(isEmptyResultError(error)).toBe(false);
    expect(isServerRefusal(error, 'Only assigned issues can be reviewed')).toBe(false);
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

/**
 * The two InvalidOperationExceptions. Rebuilt as 409s because STATUS_MESSAGES[409] says this
 * may already be done, where the 500 copy would tell the expert to retry what fails forever.
 */
describe('the refusals that are really conflicts', () => {
  it('reads the review refusal as a 409', async () => {
    route(() => respond(500, REVIEW_REFUSAL_BODY));

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({
      status: 409,
      kind: 'conflict',
      userMessage: STATUS_MESSAGES[409],
    });
  });

  it('reads the resolution refusal as a 409', async () => {
    route(() => respond(500, RESOLUTION_REFUSAL_BODY));

    await expect(
      confirmRepair({ reportId: 'issue-1', photo: PHOTO, notes: 'ملاحظة' }),
    ).rejects.toMatchObject({ status: 409, userMessage: STATUS_MESSAGES[409] });
  });
});

/**
 * The most important case in this unit. ASPNETCORE_ENVIRONMENT=Development is the only reason
 * any of the three message matches works at all: the dev exception page is what echoes the
 * message into the body. Under any other environment the body is empty, serverMessage stays
 * undefined, and all three stop matching at once - so deploying IssueService properly turns a
 * new expert's empty inbox into a red server error. This test is the thing that fails first if
 * the server configuration changes, and the fix is the exception middleware in F5, not here.
 */
describe('what Production actually returns', () => {
  it('crashes nothing on an empty body', async () => {
    route(() => respond(500, PRODUCTION_EMPTY_BODY));

    const error = await errorFrom(INBOX);

    expect(error.status).toBe(500);
    expect(error.details.serverMessage).toBeUndefined();
  });

  // What the expert sees instead of an empty inbox: "a server error, try again later".
  it('stops recognising the empty inbox', async () => {
    route(() => respond(500, PRODUCTION_EMPTY_BODY));

    await expect(getAssignedCases()).rejects.toMatchObject({
      status: 500,
      userMessage: STATUS_MESSAGES[500],
    });
  });

  // And instead of the 409: "try again later", for an action that will fail forever.
  it('stops recognising the review refusal', async () => {
    route(() => respond(500, PRODUCTION_EMPTY_BODY));

    await expect(submitReview({ reportId: 'issue-1' })).rejects.toMatchObject({
      status: 500,
      userMessage: STATUS_MESSAGES[500],
    });
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
});

// The happy path through the same seam, so a mapper suite's apiClient mock is not the only
// evidence that these two endpoints parse at all.
describe('the success bodies through client.ts', () => {
  it('parses the inbox and the farmer list off real JSON text', async () => {
    route(url =>
      url.includes('/Expert/inbox')
        ? respond(200, JSON.stringify(shortPage))
        : respond(200, JSON.stringify(withAnalysis)),
    );

    expect(await getAssignedCases()).toHaveLength(3);

    route(() => respond(200, JSON.stringify(withAppointment)));

    expect((await getMyReports())[0].id).toBe('i-1');
  });
});
