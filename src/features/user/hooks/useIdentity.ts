import { useEffect, useState } from 'react';

import { getUserDetails, resolveProfilePictureUrl } from '../services/userService';

import type { UserDetails } from '../types';

/** Who AppHeader shows. Its own hook because no screen using it needs the rest of the profile. */
export function useIdentity() {
  const [user, setUser] = useState<UserDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUserDetails()
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

  return {
    displayName: user?.fullName || '',
    // Same resolver the profile screen uses, so a profile-pictures/ key resolves the same way.
    avatarUrl: user?.picture ? resolveProfilePictureUrl(user.picture) : undefined,
    location: region || undefined,
  };
}
