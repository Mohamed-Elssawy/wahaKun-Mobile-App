import AsyncStorage from '@react-native-async-storage/async-storage';

import { tokenFor, USER_ID } from '@/__fixtures__/wire/jwt';

import { getTokenUserId, loadTokenClaims, readTokenClaims } from '../jwt';

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('readTokenClaims', () => {
  // The short names are what DefaultOutboundClaimTypeMap actually writes.
  it('reads the short claim names a normally-configured server sends', () => {
    expect(readTokenClaims(tokenFor({ role: 'Farmer', nameid: USER_ID }))).toEqual({
      roles: ['Farmer'],
      userId: USER_ID,
    });
  });

  // One line of server config away, and then nothing short is in the payload at all.
  it('falls through to the long claim URIs', () => {
    const token = tokenFor({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Expert',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': USER_ID,
    });

    expect(readTokenClaims(token)).toEqual({ roles: ['Expert'], userId: USER_ID });
  });

  it('reads `roles` and `sub` as the middle fallback', () => {
    expect(readTokenClaims(tokenFor({ roles: 'Expert', sub: USER_ID }))).toEqual({
      roles: ['Expert'],
      userId: USER_ID,
    });
  });

  // §4.5: a string for a single-role user, an array for a multi-role one.
  it('normalises both shapes of the role claim to an array', () => {
    expect(readTokenClaims(tokenFor({ role: 'Expert' }))?.roles).toEqual(['Expert']);
    expect(readTokenClaims(tokenFor({ role: ['Farmer', 'Expert'] }))?.roles).toEqual([
      'Farmer',
      'Expert',
    ]);
  });

  it('skips a claim that is present but empty', () => {
    expect(readTokenClaims(tokenFor({ role: '', roles: 'Expert' }))?.roles).toEqual([
      'Expert',
    ]);
    expect(readTokenClaims(tokenFor({ role: [], roles: 'Expert' }))?.roles).toEqual([
      'Expert',
    ]);
  });

  it('survives a token carrying neither claim', () => {
    expect(readTokenClaims(tokenFor({ exp: 1799999999 }))).toEqual({
      roles: [],
      userId: null,
    });
  });

  // Returning null rather than throwing is what keeps an unreadable token a farmer.
  it.each([
    ['no token', null],
    ['an empty string', ''],
    ['one with no payload segment', 'header-only'],
    ['one whose payload is not base64', 'a.!!!!.c'],
    ['one whose payload is not JSON', 'a.bm90IGpzb24.c'],
  ])('returns null for %s', (_name, token) => {
    expect(readTokenClaims(token)).toBeNull();
  });

  // The `name` claim is the UserName, which is Arabic for most of these accounts.
  it('decodes a non-ASCII claim without mangling it', () => {
    const token = tokenFor({ role: 'Farmer', nameid: USER_ID, name: 'يوسف زين' });

    expect(readTokenClaims(token)).toEqual({ roles: ['Farmer'], userId: USER_ID });
  });
});

describe('loadTokenClaims', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the stored access token', async () => {
    storage.getItem.mockResolvedValue(tokenFor({ role: 'Expert', nameid: USER_ID }));

    await expect(loadTokenClaims()).resolves.toEqual({
      roles: ['Expert'],
      userId: USER_ID,
    });
    await expect(getTokenUserId()).resolves.toBe(USER_ID);
  });

  it('answers null when there is no session', async () => {
    storage.getItem.mockResolvedValue(null);

    await expect(loadTokenClaims()).resolves.toBeNull();
    await expect(getTokenUserId()).resolves.toBeNull();
  });

  // Keyed by the token, so a refresh re-decodes instead of serving the replaced token's claims.
  it('re-decodes once the token changes', async () => {
    storage.getItem.mockResolvedValue(tokenFor({ role: 'Farmer', nameid: 'first' }));
    await expect(getTokenUserId()).resolves.toBe('first');

    storage.getItem.mockResolvedValue(tokenFor({ role: 'Expert', nameid: 'second' }));
    await expect(loadTokenClaims()).resolves.toEqual({
      roles: ['Expert'],
      userId: 'second',
    });
  });
});
