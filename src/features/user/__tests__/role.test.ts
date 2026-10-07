import type { TokenClaims } from '@/api';

import { loadRoleIdentity, resolveRole, roleFromClaims, roleFromDetails } from '../role';

import type { UserDetails } from '../types';

const mockLoadTokenClaims = jest.fn<Promise<TokenClaims | null>, []>();
const mockGetUserDetails = jest.fn();

// The subscriber list lives inside the factory: role.ts subscribes while it is being imported,
// which is before any `let` in this file has run, so a captured reference out here is lost.
jest.mock('@/api', () => {
  const listeners: Array<() => void> = [];

  return {
    loadTokenClaims: () => mockLoadTokenClaims(),
    onTokensCleared: (listener: () => void) => {
      listeners.push(listener);
      return () => {};
    },
    /** Fires what clearTokens fires, without a real logout. */
    __fireTokensCleared: () => listeners.forEach(listener => listener()),
  };
});

const { __fireTokensCleared: fireTokensCleared } = jest.requireMock('@/api') as {
  __fireTokensCleared: () => void;
};

jest.mock('../services', () => ({
  userApi: { getUserDetails: (...args: unknown[]) => mockGetUserDetails(...args) },
}));

function details(overrides: Partial<UserDetails> = {}): UserDetails {
  return {
    id: 'u-1',
    fullName: 'يوسف زين',
    email: 'farmer@wahakun.local',
    phoneNumber: '+201000000001',
    picture: '',
    village: 'شالي',
    region: 'واحة سيوة',
    ...overrides,
  };
}

const claims = (roles: string[]): TokenClaims => ({ roles, userId: 'f86295b1' });

beforeEach(() => {
  mockLoadTokenClaims.mockReset();
  mockGetUserDetails.mockReset();
  // A fresh cache per test: the module holds it between them otherwise.
  fireTokensCleared();
});

/** The reading that runs once UserDetailsResponse carries the fields. */
describe('roleFromDetails', () => {
  it('reads a farmer', () => {
    expect(roleFromDetails(details({ role: 'farmer' }))).toEqual({
      role: 'farmer',
      approval: 'approved',
    });
  });

  it('reads an approved expert', () => {
    expect(roleFromDetails(details({ role: 'expert', status: 'approved' }))).toEqual({
      role: 'expert',
      approval: 'approved',
    });
  });

  it.each([
    [1, 'approved'],
    [2, 'pending'],
    [3, 'rejected'],
    [4, 'suspended'],
  ] as const)('reads UserStatus %i as %s', (code, approval) => {
    expect(roleFromDetails(details({ role: 'expert', status: code })).approval).toBe(
      approval,
    );
  });

  // Fails closed: without a stated approval an expert does not get the expert shell.
  it('treats an expert with no status as pending', () => {
    expect(roleFromDetails(details({ role: 'expert' })).approval).toBe('pending');
  });

  it('treats a UserStatus value it does not know as pending', () => {
    expect(roleFromDetails(details({ role: 'expert', status: 9 as 1 })).approval).toBe(
      'pending',
    );
  });

  // §4.1 only gates experts, so a farmer is never held at S-08 by a stale status.
  it('ignores a status on a farmer', () => {
    expect(roleFromDetails(details({ role: 'farmer', status: 'suspended' }))).toEqual({
      role: 'farmer',
      approval: 'approved',
    });
  });

  // An expert shell shown to a farmer would expose other people's cases, so absent means farmer.
  it('defaults to a farmer when there is no role at all', () => {
    expect(roleFromDetails(null)).toEqual({ role: 'farmer', approval: 'approved' });
    expect(roleFromDetails(details()).role).toBe('farmer');
  });
});

/** Where the role really comes from: §4.5's role claim, verbatim `Farmer` or `Expert`. */
describe('roleFromClaims', () => {
  it('reads an Expert token as an approved expert', () => {
    expect(roleFromClaims(claims(['Expert']))).toEqual({
      role: 'expert',
      approval: 'approved',
    });
  });

  it('reads a Farmer token as a farmer', () => {
    expect(roleFromClaims(claims(['Farmer']))).toEqual({
      role: 'farmer',
      approval: 'approved',
    });
  });

  // A multi-role account is entitled to the expert shell, so the wider role wins.
  it('prefers Expert over Farmer when the token carries both', () => {
    expect(roleFromClaims(claims(['Farmer', 'Expert'])).role).toBe('expert');
  });

  // The claim is `Expert` verbatim, so nothing else in it may open the expert shell.
  it.each([[[]], [['Admin']], [['expert']]])(
    'treats %j as a farmer rather than guessing',
    roles => {
      expect(roleFromClaims(claims(roles)).role).toBe('farmer');
    },
  );
});

describe('loadRoleIdentity', () => {
  // A dead session, not a farmer: bootRoute sends this to its own screen, per §4.1's last row.
  it('throws when there is no readable token', async () => {
    mockLoadTokenClaims.mockResolvedValue(null);

    await expect(loadRoleIdentity()).rejects.toThrow(/no identity to resolve/);
    expect(mockGetUserDetails).not.toHaveBeenCalled();
  });

  it('resolves the role from the token', async () => {
    mockLoadTokenClaims.mockResolvedValue(claims(['Expert']));
    mockGetUserDetails.mockResolvedValue(details());

    await expect(loadRoleIdentity()).resolves.toEqual({
      role: 'expert',
      approval: 'approved',
    });
  });

  // The token already says who we are, so a UserService outage must not cost us the session.
  it('keeps what the token said when getUserDetails fails', async () => {
    mockLoadTokenClaims.mockResolvedValue(claims(['Expert']));
    mockGetUserDetails.mockRejectedValue(new Error('UserService is down'));

    await expect(loadRoleIdentity()).resolves.toEqual({
      role: 'expert',
      approval: 'approved',
    });
    expect(mockGetUserDetails).toHaveBeenCalled();
  });

  // Still wired, so the day UserDetailsResponse grows the field it takes over on its own.
  it('prefers the details once they carry a role', async () => {
    mockLoadTokenClaims.mockResolvedValue(claims(['Farmer']));
    mockGetUserDetails.mockResolvedValue(details({ role: 'expert', status: 'pending' }));

    await expect(loadRoleIdentity()).resolves.toEqual({
      role: 'expert',
      approval: 'pending',
    });
  });
});

/** `resolveRole` is synchronous, so what it answers with is whatever the boot path cached. */
describe('resolveRole', () => {
  // The committed build no longer mocks the role, so a cold cache is the farmer fail-safe.
  it('falls back to the details, and so to a farmer, before the token has been read', () => {
    expect(resolveRole(null)).toEqual({ role: 'farmer', approval: 'approved' });
  });

  it('echoes what loadRoleIdentity read from the token', async () => {
    mockLoadTokenClaims.mockResolvedValue(claims(['Expert']));
    mockGetUserDetails.mockResolvedValue(details());
    await loadRoleIdentity();

    // Even when handed details: the token outranks a DTO that carries no role at all.
    expect(resolveRole(null)).toEqual({ role: 'expert', approval: 'approved' });
    expect(resolveRole(details())).toEqual({ role: 'expert', approval: 'approved' });
  });

  // clearTokens fires on logout and on an expired session alike.
  it('forgets the cached identity once the tokens are cleared', async () => {
    mockLoadTokenClaims.mockResolvedValue(claims(['Expert']));
    mockGetUserDetails.mockResolvedValue(details());
    await loadRoleIdentity();
    expect(resolveRole(null).role).toBe('expert');

    fireTokensCleared();

    expect(resolveRole(null)).toEqual({ role: 'farmer', approval: 'approved' });
  });
});
