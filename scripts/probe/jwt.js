'use strict';

/* eslint-env node */

// Unverified on purpose: the only question is which claim names the server actually writes.

/** The long schema URIs, last in each fallback chain. Spelled out, not computed. */
const ROLE_CLAIMS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];
const ID_CLAIMS = [
  'nameid',
  'sub',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
];

function decodeSegment(segment) {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

/** Returns the first name in `names` that is present on `payload`, or null. */
function firstPresent(payload, names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(payload, name)) return name;
  }
  return null;
}

function describe(token) {
  if (!token || typeof token !== 'string') {
    return { error: 'no token' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { error: `not a three-part JWT (${parts.length} dot-separated parts)` };
  }

  let header;
  let payload;
  try {
    header = decodeSegment(parts[0]);
    payload = decodeSegment(parts[1]);
  } catch (error) {
    return { error: `could not decode: ${error.message}` };
  }

  const roleClaim = firstPresent(payload, ROLE_CLAIMS);
  const idClaim = firstPresent(payload, ID_CLAIMS);
  const roleValue = roleClaim ? payload[roleClaim] : undefined;

  return {
    header,
    payload,
    claimNames: Object.keys(payload),
    roleClaim,
    roleClaimsPresent: ROLE_CLAIMS.filter(n =>
      Object.prototype.hasOwnProperty.call(payload, n),
    ),
    roleValue,
    roleValueShape: Array.isArray(roleValue) ? 'array' : typeof roleValue,
    idClaim,
    idClaimsPresent: ID_CLAIMS.filter(n =>
      Object.prototype.hasOwnProperty.call(payload, n),
    ),
    userId: idClaim ? payload[idClaim] : null,
    issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    lifetimeMinutes:
      payload.exp && payload.iat ? Math.round((payload.exp - payload.iat) / 60) : null,
    signatureLength: parts[2].length,
  };
}

module.exports = { describe, ROLE_CLAIMS, ID_CLAIMS };
