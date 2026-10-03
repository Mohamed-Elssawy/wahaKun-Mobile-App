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
  // Defaults to farmer rather than throwing. An expert sent to the farmer shell is a
  // nuisance; a farmer sent to the expert shell would be shown other people's cases.
  const role = details?.role ?? 'farmer';

  return { role, approval: normalizeApproval(details?.status, role === 'expert') };
}

/** What callers use. The swap to the real field is deleting the flag branch, nothing more. */
export function resolveRole(details: UserDetails | null): RoleIdentity {
  if (USE_MOCK_ROLE) {
    return { role: MOCK_ROLE, approval: MOCK_EXPERT_APPROVAL };
  }

  return roleFromDetails(details);
}

/**
 * For the boot path, which runs before any screen and so cannot use a hook. Throws rather
 * than guessing, because §4.1 sends a failed session check to its own screen.
 */
export async function loadRoleIdentity(): Promise<RoleIdentity> {
  // No request when the answer is mocked: UserService may not be running at all.
  if (USE_MOCK_ROLE) {
    return resolveRole(null);
  }

  return resolveRole(await userApi.getUserDetails());
}
