import type { RoleIdentity } from '@/features/user/types';

import type { BootDecision } from './types';

export type RouteInput = {
  hasSession: boolean;
  /** firstRunStore's answer, which decides between the slideshow and Welcome. */
  hasSeenIntro: boolean;
  /** Null whenever there is no session, and whenever the role could not be read. */
  identity: RoleIdentity | null;
  /** §4.1's last row. Takes precedence over everything else. */
  sessionCheckFailed?: boolean;
};

/** §4.1, exactly. The only place that decides which shell an account lands in. */
export function routeForIdentity({
  hasSession,
  hasSeenIntro,
  identity,
  sessionCheckFailed = false,
}: RouteInput): BootDecision {
  if (sessionCheckFailed) {
    return { name: 'SessionError' };
  }

  if (!hasSession) {
    return { name: hasSeenIntro ? 'Welcome' : 'IntroSlideshow' };
  }

  // A session with no readable role is treated as a failed check rather than guessed at:
  // §4.1 has no row for it, and the wrong guess shows one role the other's screens.
  if (!identity) {
    return { name: 'SessionError' };
  }

  if (identity.role === 'farmer') {
    return { name: 'Home' };
  }

  if (identity.approval === 'approved') {
    return { name: 'ExpertHome' };
  }

  // S-08 is outside any shell, so this is a route and never a banner on one.
  return { name: 'AccountStatus', params: { state: identity.approval } };
}
