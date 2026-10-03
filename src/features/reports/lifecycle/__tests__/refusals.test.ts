import { requestWrite } from '../permissions';
import { attempt } from '../transitions';
import { atNode5, atNode6, resolved } from './fixtures';

/** §3.6, clause by clause. Each one is something a screen must never offer. */
describe('§3.6 transitions that do not exist', () => {
  it('the expert cannot move a case to تم الحل', () => {
    expect(attempt({ event: 'farmerConfirms', actor: 'expert', facts: atNode6 })).toEqual(
      {
        ok: false,
        refusal: 'R-EXPERT-CANNOT-CLOSE',
      },
    );

    expect(requestWrite('statusResolved', 'expert')).toEqual({
      ok: false,
      refusal: 'R-EXPERT-CANNOT-CLOSE',
    });
  });

  it.each(['declineCase', 'handBack', 'returnToNew'] as const)(
    'the expert cannot %s',
    event => {
      expect(attempt({ event, actor: 'expert', facts: atNode5 })).toEqual({
        ok: false,
        refusal: 'R-EXPERT-CANNOT-HAND-BACK',
      });
    },
  );

  it('the farmer cannot change severity', () => {
    expect(requestWrite('severity', 'farmer')).toEqual({
      ok: false,
      refusal: 'R-FARMER-CANNOT-SET-SEVERITY',
    });
  });

  it('the farmer cannot change the appointment', () => {
    expect(requestWrite('appointment', 'farmer')).toEqual({
      ok: false,
      refusal: 'R-FARMER-CANNOT-SET-APPOINTMENT',
    });
  });

  it('the farmer cannot change the assigned expert', () => {
    expect(requestWrite('assignedExpert', 'farmer')).toEqual({
      ok: false,
      refusal: 'R-FARMER-CANNOT-SET-EXPERT',
    });
  });

  it('تم الحل is terminal, so the only reopen control is the cross before the tick', () => {
    expect(attempt({ event: 'farmerRejects', actor: 'farmer', facts: resolved })).toEqual(
      {
        ok: false,
        refusal: 'S-TERMINAL',
      },
    );

    // The same cross does work at node 6, which is what makes the clause about ordering.
    expect(attempt({ event: 'farmerRejects', actor: 'farmer', facts: atNode6 }).ok).toBe(
      true,
    );
  });

  it('nothing on mobile produces مغلقة إدارياً', () => {
    expect(attempt({ event: 'adminForceClose', actor: 'admin', facts: atNode5 })).toEqual(
      {
        ok: false,
        refusal: 'R-NO-MOBILE-ADMIN-CLOSE',
      },
    );

    expect(requestWrite('statusAdminClosed', 'admin')).toEqual({
      ok: false,
      refusal: 'R-NO-MOBILE-ADMIN-CLOSE',
    });
  });

  it('nothing on mobile reassigns a case', () => {
    expect(attempt({ event: 'adminReassign', actor: 'admin', facts: atNode5 })).toEqual({
      ok: false,
      refusal: 'R-NO-MOBILE-ADMIN-REASSIGN',
    });
  });

  it('there is no timeout transition anywhere', () => {
    expect(attempt({ event: 'timeout', actor: 'system', facts: atNode5 })).toEqual({
      ok: false,
      refusal: 'R-NO-TIMEOUT',
    });

    expect(attempt({ event: 'timeout', actor: 'system', facts: null })).toEqual({
      ok: false,
      refusal: 'R-NO-TIMEOUT',
    });
  });
});

describe('actor guards', () => {
  it('refuses an event sent by an actor that does not own it', () => {
    expect(attempt({ event: 'confirmRepair', actor: 'farmer', facts: atNode5 })).toEqual({
      ok: false,
      refusal: 'R-WRONG-ACTOR',
    });

    expect(attempt({ event: 'autoRoute', actor: 'expert', facts: atNode5 })).toEqual({
      ok: false,
      refusal: 'R-WRONG-ACTOR',
    });
  });

  // The §3.6 code has to win over the generic one, or the reason is lost.
  it('prefers the §3.6 code over R-WRONG-ACTOR where both apply', () => {
    const result = attempt({ event: 'farmerConfirms', actor: 'expert', facts: atNode6 });

    expect(result).toEqual({ ok: false, refusal: 'R-EXPERT-CANNOT-CLOSE' });
  });
});
