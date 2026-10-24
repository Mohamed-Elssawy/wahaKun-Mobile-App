import { loadTokenClaims, onTokensCleared } from '@/api';
import type { TokenClaims } from '@/api';
import { MOCK_EXPERT_APPROVAL, MOCK_ROLE, USE_MOCK_ROLE } from '@/config/env';

import { userApi } from './services';

import type { ExpertApproval, RoleIdentity, UserDetails } from './types';

/** UserStatus's numbering, for when the field lands as a bare enum the way IssueStatus did. */
const APPROVAL_BY_CODE: Record<number, ExpertApproval> = {
  1: 'approved',
  2: 'pending',
  3: 'rejected',
  4: 'suspended',
};

function normalizeApproval(
  status: UserDetails['status'],
  isExpert: boolean,
): ExpertApproval {
  // §4.1 only gates experts, so a farmer's approval is never asked about.
  if (!isExpert) {
    return 'approved';
  }

  if (typeof status === 'number') {
    return APPROVAL_BY_CODE[status] ?? 'pending';
  }

  // Fails closed: an expert without a stated approval does not get the expert shell.
  return status ?? 'pending';
}

/** The real reading, flag-free so both halves stay testable before the field exists. */
export function roleFromDetails(details: UserDetails | null): RoleIdentity {
  // Defaults to farmer: a farmer in the expert shell would be shown other people's cases.
  const role = details?.role ?? 'farmer';

  return { role, approval: normalizeApproval(details?.status, role === 'expert') };
}

/** Verbatim from the backend's `[Authorize(Roles = …)]` attributes - §4.5. */
const EXPERT_ROLE = 'Expert';

/** Expert wins over Farmer, because the account is then entitled to the expert shell. */
export function roleFromClaims(claims: TokenClaims): RoleIdentity {
  const isExpert = claims.roles.includes(EXPERT_ROLE);

  // A token saying Expert means AuthService issued that role, which it only does once approved.
  return { role: isExpert ? 'expert' : 'farmer', approval: 'approved' };
}

/** Echoed from the one async token read, so the synchronous resolveRole has an answer. */
let cachedIdentity: RoleIdentity | null = null;
let watchingSession = false;

/** Subscribed on first read, not at import, so importing this module has no side effects. */
function watchSession(): void {
  if (watchingSession) {
    return;
  }
  watchingSession = true;

  onTokensCleared(() => {
    cachedIdentity = null;
  });
}

/** What callers use. The swap to the real field is deleting the flag branch, nothing more. */
export function resolveRole(details: UserDetails | null): RoleIdentity {
  if (USE_MOCK_ROLE) {
    return { role: MOCK_ROLE, approval: MOCK_EXPERT_APPROVAL };
  }

  // The token is the source of truth; a cold cache falls to the farmer default.
  return cachedIdentity ?? roleFromDetails(details);
}

const NO_READABLE_TOKEN =
  'No readable access token: the role lives in its claims, so there is no identity to resolve.';

/** For the boot path, which cannot use a hook. Throws only on a dead session. */
export async function loadRoleIdentity(): Promise<RoleIdentity> {
  // No request when the answer is mocked: UserService may not be running at all.
  if (USE_MOCK_ROLE) {
    return resolveRole(null);
  }

  const claims = await loadTokenClaims();
  // No token, or one that will not decode, is a dead session rather than a farmer.
  if (!claims) {
    throw new Error(NO_READABLE_TOKEN);
  }

  watchSession();
  cachedIdentity = roleFromClaims(claims);

  // Still called so roleFromDetails stays wired, but its failure must not block boot.
  const details = await userApi.getUserDetails().catch(() => null);
  if (details?.role) {
    cachedIdentity = roleFromDetails(details);
  }

  return cachedIdentity;
}
