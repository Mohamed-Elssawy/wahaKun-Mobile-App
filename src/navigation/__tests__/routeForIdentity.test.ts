import type { ExpertApproval } from '@/features/user/types';

import { routeForIdentity } from '../routeForIdentity';

import type { RouteInput } from '../routeForIdentity';

function input(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    hasSession: true,
    hasSeenIntro: true,
    identity: { role: 'farmer', approval: 'approved' },
    ...overrides,
  };
}

function expert(approval: ExpertApproval) {
  return input({ identity: { role: 'expert', approval } });
}

/** §4.1, row by row. Taken at S-01 and after every successful authentication. */
describe('§4.1 role routing', () => {
  it('sends a farmer to the farmer shell', () => {
    expect(routeForIdentity(input())).toEqual({ name: 'Home' });
  });

  it('sends an approved expert to the expert shell', () => {
    expect(routeForIdentity(expert('approved'))).toEqual({ name: 'ExpertHome' });
  });

  it.each(['pending', 'rejected', 'suspended'] as const)(
    'sends a %s expert to S-08 with that state',
    approval => {
      expect(routeForIdentity(expert(approval))).toEqual({
        name: 'AccountStatus',
        params: { state: approval },
      });
    },
  );

  it('sends a returning visitor with no session to Welcome', () => {
    expect(routeForIdentity(input({ hasSession: false, identity: null }))).toEqual({
      name: 'Welcome',
    });
  });

  it('sends a first-time visitor to the slideshow', () => {
    expect(
      routeForIdentity(input({ hasSession: false, hasSeenIntro: false, identity: null })),
    ).toEqual({ name: 'IntroSlideshow' });
  });

  it('sends a failed session check to X-01', () => {
    expect(routeForIdentity(input({ sessionCheckFailed: true }))).toEqual({
      name: 'SessionError',
    });
  });
});

describe('the rows §4.1 does not have', () => {
  // Guessing would show one role the other's screens, so an unreadable role is a failed check.
  it('treats a session with no readable role as a failed check, not as a farmer', () => {
    expect(routeForIdentity(input({ identity: null }))).toEqual({
      name: 'SessionError',
    });
  });

  // §4.1's last row is unconditional: nothing below it gets a chance to answer first.
  it('prefers X-01 over every other row', () => {
    expect(routeForIdentity({ ...expert('approved'), sessionCheckFailed: true })).toEqual(
      { name: 'SessionError' },
    );

    expect(
      routeForIdentity(
        input({ hasSession: false, identity: null, sessionCheckFailed: true }),
      ),
    ).toEqual({ name: 'SessionError' });
  });

  // An unapproved expert must reach no shell at all, so S-08 cannot be a Home with a banner.
  it('never routes an unapproved expert to either shell', () => {
    (['pending', 'rejected', 'suspended'] as const).forEach(approval => {
      const decision = routeForIdentity(expert(approval));

      expect(decision.name).not.toBe('Home');
      expect(decision.name).not.toBe('ExpertHome');
    });
  });
});
