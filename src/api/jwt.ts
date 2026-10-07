/** Reads the claims the access token already carries. Nothing here verifies anything: the
 * server signed the token and validates it on every request, so this is a read, not a check. */

// The role lives only in the JWT - UserDetailsResponse has no role field and is not getting
// one before the deadline - see BACKEND-INTEGRATION-FACTS.md §4.4/§4.5.

import { decodeJwtPayload } from './session';
import { getAccessToken } from './tokenStorage';

/**
 * §4.5's claim names, in the order they are tried. `JwtSecurityTokenHandler` applies
 * `DefaultOutboundClaimTypeMap` when it writes the token, so the short name is what normally
 * lands - but the long URI is what arrives if that map is ever cleared, which is one line of
 * server configuration, so both are read.
 */
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
  /**
   * Always an array. The role claim is a bare string for a single-role user and an array for
   * a multi-role one (§4.5), and no caller should have to know which it got.
   */
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

// Keyed by the token itself, so a refresh re-decodes rather than serving the claims of the
// token it replaced. One AsyncStorage read and one base64 decode per distinct token.
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
