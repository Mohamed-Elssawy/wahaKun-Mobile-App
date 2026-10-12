// AuthService access tokens, BACKEND-INTEGRATION-FACTS.md §4.5. TokenService writes Name,
// PhoneNumber, NameIdentifier and one Role claim per role, and JwtSecurityTokenHandler's
// DefaultOutboundClaimTypeMap decides whether the short name or the long URI lands.
// The encoder lives here rather than in a suite: api/__tests__/jwt.test.ts imports it, so one
// base64url writer faces the one production decoder and the two cannot drift apart.

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
export function base64Url(value: string): string {
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

export function tokenFor(payload: Record<string, unknown>): string {
  // The header and signature are never read, so they only have to be present.
  return `eyJhbGciOiJIUzI1NiJ9.${base64Url(JSON.stringify(payload))}.c2lnbmF0dXJl`;
}

/** ClaimTypes.NameIdentifier, which is the guid every authorised route compares against. */
export const USER_ID = 'f86295b1-6d2e-4a6f-9d2a-0c1b3e5a7d91';

/** Access-token lifetime is 60 minutes, so a live token's `exp` is an hour out - §4.5. */
const ONE_HOUR_FROM_NOW = Math.floor(Date.now() / 1000) + 60 * 60;

/** A single-role user gets a bare string. The short names are what the default map writes. */
export const singleRoleFarmer = tokenFor({
  role: 'Farmer',
  nameid: USER_ID,
  name: 'يوسف زين',
  exp: ONE_HOUR_FROM_NOW,
});

export const singleRoleExpert = tokenFor({
  role: 'Expert',
  nameid: USER_ID,
  exp: ONE_HOUR_FROM_NOW,
});

/** A multi-role user gets an array. Expert wins: the account is entitled to the expert shell. */
export const multiRoleArray = tokenFor({
  role: ['Farmer', 'Expert'],
  nameid: USER_ID,
  exp: ONE_HOUR_FROM_NOW,
});

/** One line of server configuration away, and then nothing short is in the payload at all. */
export const longSchemaUris = tokenFor({
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Expert',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': USER_ID,
  exp: ONE_HOUR_FROM_NOW,
});

/** `roles` and `sub`, the middle pair of fallbacks. */
export const middleFallbackClaims = tokenFor({
  roles: 'Expert',
  sub: USER_ID,
  exp: ONE_HOUR_FROM_NOW,
});

/** Expired in November 2023, so it is still expired whenever this suite runs. */
export const expired = tokenFor({ role: 'Farmer', nameid: USER_ID, exp: 1700000000 });

/** The UserName claim is Arabic for most of these accounts, and must survive the decode. */
export const arabicNameClaim = tokenFor({
  role: 'Farmer',
  nameid: USER_ID,
  name: 'يوسف زين',
  phone_number: '+201000000001',
  exp: ONE_HOUR_FROM_NOW,
});

/** Three segments, and the middle one is not base64 - a dead session, not a farmer. */
export const malformed = 'eyJhbGciOiJIUzI1NiJ9.!!!not-base64!!!.c2lnbmF0dXJl';

/** A token AuthService could issue for an account with no role assigned at all. */
export const noClaims = tokenFor({ exp: ONE_HOUR_FROM_NOW });
