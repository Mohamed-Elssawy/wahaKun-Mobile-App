import { resolveRole, roleFromDetails } from '../role';

import type { UserDetails } from '../types';

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

describe('resolveRole with the committed flag', () => {
  // The whole point of the flag: the committed build boots the farmer shell, as it did before.
  it('answers with the mocked farmer whatever the details say', () => {
    expect(resolveRole(null)).toEqual({ role: 'farmer', approval: 'approved' });

    expect(resolveRole(details({ role: 'expert', status: 'suspended' }))).toEqual({
      role: 'farmer',
      approval: 'approved',
    });
  });
});
