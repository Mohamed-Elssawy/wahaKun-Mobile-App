import { useEffect, useState } from 'react';

import { resolveRole } from '../role';
import { resolveProfilePictureUrl, userApi } from '../services';

import type { UserDetails } from '../types';

/** Who AppHeader shows. Its own hook because no screen using it needs the rest of the profile. */
export function useIdentity() {
  const [user, setUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    userApi
      .getUserDetails()
      .then(details => {
        if (!cancelled) {
          setUser(details);
        }
      })
      // The header degrades to a placeholder avatar; nothing here is worth a screen.
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const region = [user?.region, user?.village].filter(Boolean).join('، ');
  // Resolved here rather than fetched again: this hook already holds the details it reads.
  const { role, approval } = resolveRole(user);

  return {
    /** Who the signed-in farmer is. Undefined until UserService answers, and if it never does. */
    // Consumers gating on ownership must fail closed on undefined: see useIssueDetails.
    userId: user?.id || undefined,
    displayName: user?.fullName || '',
    // Same resolver the profile screen uses, so a profile-pictures/ key resolves the same way.
    avatarUrl: user?.picture ? resolveProfilePictureUrl(user.picture) : undefined,
    location: region || undefined,
    /** §4.1's two account types. Mocked until UserDetailsResponse carries the field. */
    role,
    /** Always 'approved' for a farmer; §4.1 only gates experts. */
    approval,
  };
}
