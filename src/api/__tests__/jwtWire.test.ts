/**
 * §4.5's tokens end to end: the fixture writes the payload the way AuthService does, the
 * production decoder reads it back, and role.ts turns the claims into a shell. jwt.test.ts
 * covers readTokenClaims on hand-built payloads; this suite covers the whole chain on the
 * tokens the server actually issues, plus the expiry branch neither had.
 */

import {
  arabicNameClaim,
  expired,
  longSchemaUris,
  malformed,
  middleFallbackClaims,
  multiRoleArray,
  noClaims,
  singleRoleExpert,
  singleRoleFarmer,
  tokenFor,
  USER_ID,
} from '@/__fixtures__/wire/jwt';
import { API_BASE_URLS } from '@/config/env';
import { roleFromClaims } from '@/features/user/role';

import { API_ENDPOINTS } from '../endpoints';
import { getTokenUserId, loadTokenClaims, readTokenClaims } from '../jwt';
import { getValidAccessToken, isTokenExpired } from '../session';
import { saveTokens } from '../tokenStorage';

import type { TokenClaims } from '../jwt';

// jest.setup's stub never returns what it stored, and every path here reads a stored token.
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

function claimsOf(token: string): TokenClaims {
  const claims = readTokenClaims(token);
  if (!claims) {
    throw new Error('expected the token to decode');
  }
  return claims;
}

beforeEach(() => fetchMock.mockReset());

describe('the role claim, both shapes', () => {
  // A single-role user gets a bare string, a multi-role one an array, and no caller should care.
  it('reads a single-role string claim', () => {
    expect(claimsOf(singleRoleFarmer)).toEqual({ roles: ['Farmer'], userId: USER_ID });
    expect(roleFromClaims(claimsOf(singleRoleFarmer))).toEqual({
      role: 'farmer',
      approval: 'approved',
    });
  });

  it('reads a multi-role array claim, and Expert wins', () => {
    const claims = claimsOf(multiRoleArray);

    expect(claims.roles).toEqual(['Farmer', 'Expert']);
    // The account is entitled to the expert shell, so the wider role is the one that counts.
    expect(roleFromClaims(claims).role).toBe('expert');
  });

  // One line of server configuration clears DefaultOutboundClaimTypeMap, and then only these land.
  it('falls through to the long schema URIs', () => {
    expect(claimsOf(longSchemaUris)).toEqual({ roles: ['Expert'], userId: USER_ID });
    expect(roleFromClaims(claimsOf(longSchemaUris)).role).toBe('expert');
  });

  it('reads `roles` and `sub` as the middle pair of fallbacks', () => {
    expect(claimsOf(middleFallbackClaims)).toEqual({ roles: ['Expert'], userId: USER_ID });
  });

  // Defaults to farmer rather than throwing: an expert in the farmer shell is a nuisance, a
  // farmer in the expert shell would be shown other people's cases.
  it('reads a token carrying no role as a farmer', () => {
    expect(claimsOf(noClaims)).toEqual({ roles: [], userId: null });
    expect(roleFromClaims(claimsOf(noClaims)).role).toBe('farmer');
  });

  // The UserName claim is Arabic for most of these accounts and must not disturb the rest.
  it('decodes an Arabic name claim without mangling the claims beside it', () => {
    expect(claimsOf(arabicNameClaim)).toEqual({ roles: ['Farmer'], userId: USER_ID });
    expect(readTokenClaims(tokenFor({ name: 'يوسف زين' }))).toEqual({
      roles: [],
      userId: null,
    });
  });

  // Null rather than a throw is what keeps an unreadable token a dead session, not a farmer.
  it('returns null for a malformed token', () => {
    expect(readTokenClaims(malformed)).toBeNull();
  });
});

describe('the stored token', () => {
  it('serves the farmer guid GET /Farmer/issues needs twice over', async () => {
    await saveTokens(singleRoleFarmer, 'refresh-1');

    await expect(loadTokenClaims()).resolves.toEqual({ roles: ['Farmer'], userId: USER_ID });
    await expect(getTokenUserId()).resolves.toBe(USER_ID);
  });

  it('answers null for a stored token that will not decode', async () => {
    await saveTokens(malformed, 'refresh-1');

    await expect(loadTokenClaims()).resolves.toBeNull();
    await expect(getTokenUserId()).resolves.toBeNull();
  });
});

/** Access-token lifetime is 60 minutes, so this branch runs on every session over an hour old. */
describe('an expired access token', () => {
  it('reads as expired, and a live one does not', () => {
    expect(isTokenExpired(expired)).toBe(true);
    expect(isTokenExpired(singleRoleFarmer)).toBe(false);
    // 30 seconds of skew, so a token about to die is refreshed before a request is spent on it.
    expect(isTokenExpired(tokenFor({ exp: Math.floor(Date.now() / 1000) + 10 }))).toBe(true);
  });

  it('sends getValidAccessToken down the refresh path and returns the new token', async () => {
    await saveTokens(expired, 'refresh-1');
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
        json: () =>
          Promise.resolve(
            String(url).includes(API_ENDPOINTS.auth.refreshToken)
              ? { accessToken: singleRoleExpert, refreshToken: 'refresh-2' }
              : {},
          ),
      } as unknown as Response),
    );

    await expect(getValidAccessToken()).resolves.toBe(singleRoleExpert);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URLS.auth}${API_ENDPOINTS.auth.refreshToken}`,
      expect.objectContaining({ method: 'POST' }),
    );
    // Keyed by the token, so the claims of the token it replaced are not served on.
    await expect(loadTokenClaims()).resolves.toEqual({ roles: ['Expert'], userId: USER_ID });
  });

  it('answers null when there is no refresh token to spend', async () => {
    await saveTokens(expired, '');

    await expect(getValidAccessToken()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
