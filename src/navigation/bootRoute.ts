import { getAccessToken } from '@/api';
import { DEMO_MODE } from '@/config/env';
import { hasSeenIntro } from '@/features/onboarding/services/firstRunStore';
import { loadRoleIdentity } from '@/features/user/role';

import { routeForIdentity } from './routeForIdentity';

import type { BootDecision } from './types';

/**
 * §4.1 at boot. Lives here rather than in app/App.tsx so X-01's retry can run it again
 * without the navigator remounting.
 */
export async function resolveBootDecision(): Promise<BootDecision> {
  let hasSession: boolean;

  try {
    // Auth has no mock - AuthService and Firebase are the only ways to get a token - so
    // without this the demo stops at the login screen and no flag downstream is ever reached.
    // This is a committed flag defaulting to false, not the hardcoded initialRouteName shortcut.
    hasSession = DEMO_MODE || Boolean(await getAccessToken());
  } catch {
    return routeForIdentity({
      hasSession: false,
      hasSeenIntro: false,
      identity: null,
      sessionCheckFailed: true,
    });
  }

  if (!hasSession) {
    // A failed first-run read is not a failed session check, so it must not reach X-01.
    const seenIntro = await hasSeenIntro().catch(() => true);

    return routeForIdentity({
      hasSession: false,
      hasSeenIntro: seenIntro,
      identity: null,
    });
  }

  try {
    const identity = await loadRoleIdentity();

    return routeForIdentity({ hasSession: true, hasSeenIntro: true, identity });
  } catch {
    // §4.1's last row: a session we cannot resolve a role for is a failed check, not a farmer.
    return routeForIdentity({
      hasSession: true,
      hasSeenIntro: true,
      identity: null,
      sessionCheckFailed: true,
    });
  }
}
