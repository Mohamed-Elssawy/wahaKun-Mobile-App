/** Reads the claims the token already carries; the server validates what it signed. */

// The role lives only in the JWT: UserDetailsResponse has no role field.

import { decodeJwtPayload } from './session';
import { getAccessToken } from './tokenStorage';

/** Tried in order: the short name normally lands, the long URI if the outbound map is cleared. */
const ROLE_CLAIMS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
] as const;

const USER_ID_CLAIMS = [
  'nameid',
  'sub',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
] as const;

export type TokenClaims = {
  /** Always an array: the claim is a bare string for one role and an array for several. */
  roles: string[];
  /** `ClaimTypes.NameIdentifier`, which is the guid every authorised route compares against. */
  userId: string | null;
};

/** First claim that yields anything wins; an empty value falls through to the next name. */
function readRoles(payload: Record<string, unknown>): string[] {
  for (const claim of ROLE_CLAIMS) {
    const value = payload[claim];

    if (typeof value === 'string' && value) {
      return [value];
    }

    if (Array.isArray(value)) {
      const roles = value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.length > 0,
      );
      if (roles.length > 0) {
        return roles;
      }
    }
  }

  return [];
}

function readUserId(payload: Record<string, unknown>): string | null {
  for (const claim of USER_ID_CLAIMS) {
    const value = payload[claim];
    if (typeof value === 'string' && value) {
      return value;
    }
  }

  return null;
}

/** Pure. Null for a missing, malformed or unparseable token rather than a throw. */
export function readTokenClaims(token: string | null): TokenClaims | null {
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  return { roles: readRoles(payload), userId: readUserId(payload) };
}

// Keyed by the token, so a refresh re-decodes instead of serving the replaced token's claims.
let memo: { token: string; claims: TokenClaims | null } | null = null;

/** The stored access token's claims, or null when there is no readable session. */
export async function loadTokenClaims(): Promise<TokenClaims | null> {
  const token = await getAccessToken();

  if (!token) {
    memo = null;
    return null;
  }

  if (memo?.token !== token) {
    memo = { token, claims: readTokenClaims(token) };
  }

  return memo.claims;
}

/** The farmer's own guid, which `GET /Farmer/issues` needs in its path and its query string. */
export async function getTokenUserId(): Promise<string | null> {
  return (await loadTokenClaims())?.userId ?? null;
}
