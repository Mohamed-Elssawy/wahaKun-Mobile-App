import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTokenUserId, loadTokenClaims, readTokenClaims } from '../jwt';

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** UTF-8 bytes without `Buffer` or `TextEncoder`, neither of which this project has types for. */
function utf8Bytes(value: string): number[] {
  const escaped = encodeURIComponent(value);
  const bytes: number[] = [];

  for (let i = 0; i < escaped.length; i += 1) {
    if (escaped[i] === '%') {
      bytes.push(parseInt(escaped.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(escaped.charCodeAt(i));
    }
  }

  return bytes;
}

/* eslint-disable no-bitwise -- base64 is bit packing; the rule has nothing to catch here. */
/** base64url, the way AuthService writes it: no padding, `-` and `_` for `+` and `/`. */
function base64Url(value: string): string {
  const bytes = utf8Bytes(value);
  let out = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const remaining = bytes.length - i;
    const b0 = bytes[i];
    const b1 = remaining > 1 ? bytes[i + 1] : 0;
    const b2 = remaining > 2 ? bytes[i + 2] : 0;

    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 0b11) << 4) | (b1 >> 4)];
    out += remaining > 1 ? ALPHABET[((b1 & 0b1111) << 2) | (b2 >> 6)] : '';
    out += remaining > 2 ? ALPHABET[b2 & 0b111111] : '';
  }

  return out;
}
/* eslint-enable no-bitwise */

function tokenFor(payload: Record<string, unknown>): string {
  // The header and signature are never read, so they only have to be present.
  return `eyJhbGciOiJIUzI1NiJ9.${base64Url(JSON.stringify(payload))}.c2lnbmF0dXJl`;
}

const GUID = 'f86295b1-6d2e-4a6f-9d2a-0c1b3e5a7d91';

describe('readTokenClaims', () => {
  // The short names are what DefaultOutboundClaimTypeMap actually writes.
  it('reads the short claim names a normally-configured server sends', () => {
    expect(readTokenClaims(tokenFor({ role: 'Farmer', nameid: GUID }))).toEqual({
      roles: ['Farmer'],
      userId: GUID,
    });
  });

  // One line of server config away, and then nothing short is in the payload at all.
  it('falls through to the long claim URIs', () => {
    const token = tokenFor({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Expert',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': GUID,
    });

    expect(readTokenClaims(token)).toEqual({ roles: ['Expert'], userId: GUID });
  });

  it('reads `roles` and `sub` as the middle fallback', () => {
    expect(readTokenClaims(tokenFor({ roles: 'Expert', sub: GUID }))).toEqual({
      roles: ['Expert'],
      userId: GUID,
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
    const token = tokenFor({ role: 'Farmer', nameid: GUID, name: 'يوسف زين' });

    expect(readTokenClaims(token)).toEqual({ roles: ['Farmer'], userId: GUID });
  });
});

describe('loadTokenClaims', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads the stored access token', async () => {
    storage.getItem.mockResolvedValue(tokenFor({ role: 'Expert', nameid: GUID }));

    await expect(loadTokenClaims()).resolves.toEqual({
      roles: ['Expert'],
      userId: GUID,
    });
    await expect(getTokenUserId()).resolves.toBe(GUID);
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
