import { attempt, TRANSITIONS } from '../transitions';
import {
  adminClosed,
  atNode1,
  atNode2,
  atNode3,
  atNode4,
  atNode5,
  atNode6,
  reopened,
  resolved,
} from './fixtures';

import type { TransitionId } from '../transitions';

/** Guards against a row being dropped or T9 creeping back in. */
describe('the §3.5 table', () => {
  it('carries all fourteen surviving rows and no T9', () => {
    const ids = TRANSITIONS.map(rule => rule.id);

    expect(ids).toEqual([
      'T1',
      'T2',
      'T3',
      'T4',
      'T5',
      'T6',
      'T7',
      'T8',
      'T10',
      'T11',
      'T12',
      'T13',
      'T14',
      'T15',
    ]);
  });
});

function expectTransition(
  result: ReturnType<typeof attempt>,
  id: TransitionId,
): Extract<typeof result, { ok: true }> {
  if (!result.ok) {
    throw new Error(`expected ${id}, got refusal ${result.refusal}`);
  }
  expect(result.id).toBe(id);
  return result;
}

describe('§3.5 transitions', () => {
  it('T1 creates the record at node 1 and publishes it to the feed', () => {
    const result = expectTransition(
      attempt({ event: 'submit', actor: 'farmer', facts: null }),
      'T1',
    );

    expect(result.to).toBe('New');
    expect(result.node).toBe(1);
    expect(result.effects).toEqual([
      'recordCreated',
      'locationCaptured',
      'publishedToFeed',
    ]);
  });

  it('T2 writes the AI fields and leaves the status at جديدة', () => {
    const result = expectTransition(
      attempt({ event: 'aiDiagnosisReturned', actor: 'system', facts: atNode1 }),
      'T2',
    );

    expect(result.to).toBe('New');
    expect(result.node).toBe(2);
    expect(result.effects).toContain('analysisHiddenFromFarmer');
  });

  it('T3 routes the case to an expert', () => {
    const result = expectTransition(
      attempt({ event: 'autoRoute', actor: 'system', facts: atNode2 }),
      'T3',
    );

    expect(result.to).toBe('UnderReview');
    expect(result.node).toBe(3);
    expect(result.effects).toEqual(['expertNotified', 'expertChipShown']);
  });

  it('T4 submits the review without moving the status off قيد المراجعة', () => {
    const result = expectTransition(
      attempt({ event: 'submitReview', actor: 'expert', facts: atNode3 }),
      'T4',
    );

    expect(result.to).toBe('UnderReview');
    expect(result.node).toBe(4);
    expect(result.effects).toContain('severityRepainted');
  });

  it('T5 confirms the appointment and opens the chat', () => {
    const result = expectTransition(
      attempt({ event: 'confirmAppointment', actor: 'expert', facts: atNode4 }),
      'T5',
    );

    expect(result.to).toBe('Scheduled');
    expect(result.node).toBe(5);
    expect(result.effects).toContain('chatOpened');
  });

  it('T6 publishes the repair and leaves the status at مجدولة', () => {
    const result = expectTransition(
      attempt({ event: 'confirmRepair', actor: 'expert', facts: atNode5 }),
      'T6',
    );

    expect(result.to).toBe('Scheduled');
    expect(result.node).toBe(6);
    expect(result.effects).toContain('farmerAskedToConfirm');
  });

  it('T7 closes the case on the farmer tick', () => {
    const result = expectTransition(
      attempt({ event: 'farmerConfirms', actor: 'farmer', facts: atNode6 }),
      'T7',
    );

    expect(result.to).toBe('Resolved');
    expect(result.node).toBe('closed');
    expect(result.effects).toEqual([
      'chatReadOnly',
      'composerHidden',
      'severityBadgeDropped',
    ]);
  });

  it('T8 reopens to node 3 and clears nodes 4 and 5', () => {
    const result = expectTransition(
      attempt({ event: 'farmerRejects', actor: 'farmer', facts: atNode6 }),
      'T8',
    );

    expect(result.to).toBe('Reopened');
    expect(result.node).toBe(3);
    expect(result.effects).toContain('nodesFourAndFiveCleared');
    expect(result.effects).toContain('repairPhotoHiddenFromExpert');
  });

  it('T10 reschedules a reopened case and requires a reason', () => {
    const result = expectTransition(
      attempt({ event: 'reschedule', actor: 'expert', facts: reopened }),
      'T10',
    );

    expect(result.to).toBe('Scheduled');
    expect(result.node).toBe(5);
    expect(result.effects).toContain('changeReasonRequired');
  });

  it('T11 reschedules without a preceding rejection', () => {
    const result = expectTransition(
      attempt({ event: 'reschedule', actor: 'expert', facts: atNode5 }),
      'T11',
    );

    expect(result.to).toBe('Scheduled');
    expect(result.node).toBe(5);
  });

  it('T12 and T15 stay in the table even though attempt refuses them', () => {
    const forceClose = TRANSITIONS.find(rule => rule.id === 'T12');
    const reassign = TRANSITIONS.find(rule => rule.id === 'T15');

    expect(forceClose?.to).toBe('AdminClosed');
    expect(forceClose?.effects).toContain('rendersAsResolvedToFarmer');
    expect(reassign?.effects).toContain('chatClosedAndRestarted');
  });

  it('T13 persists an unreadable record without giving it a status', () => {
    const result = expectTransition(
      attempt({ event: 'evidenceUnreadable', actor: 'system', facts: null }),
      'T13',
    );

    expect(result.to).toBeNull();
    expect(result.node).toBeNull();
    expect(result.effects).toEqual(['recordPersistedUntitled']);
  });

  it('T14 discards the record the farmer retakes', () => {
    const result = expectTransition(
      attempt({ event: 'discardUnreadable', actor: 'farmer', facts: null }),
      'T14',
    );

    expect(result.to).toBeNull();
    expect(result.effects).toEqual(['recordDiscarded']);
  });
});

describe('§3.5 guards', () => {
  // §10.1 puts the tick and cross at node 6, so a farmer at node 5 has nothing to answer yet.
  it('refuses the farmer tick before the expert has published a repair', () => {
    const result = attempt({ event: 'farmerConfirms', actor: 'farmer', facts: atNode5 });

    expect(result).toEqual({ ok: false, refusal: 'R-WRONG-STATUS' });
  });

  it('refuses the farmer cross before the expert has published a repair', () => {
    const result = attempt({ event: 'farmerRejects', actor: 'farmer', facts: atNode5 });

    expect(result).toEqual({ ok: false, refusal: 'R-WRONG-STATUS' });
  });

  // §8.3's stepper puts الجدولة after مراجعة, so scheduling an unreviewed case is out of order.
  it('refuses an appointment before the review is submitted', () => {
    const result = attempt({
      event: 'confirmAppointment',
      actor: 'expert',
      facts: atNode3,
    });

    expect(result).toEqual({ ok: false, refusal: 'R-WRONG-STATUS' });
  });

  it('refuses a second repair confirmation on a case already at node 6', () => {
    const result = attempt({ event: 'confirmRepair', actor: 'expert', facts: atNode6 });

    expect(result).toEqual({ ok: false, refusal: 'R-WRONG-STATUS' });
  });

  it('refuses routing a case that is already with an expert', () => {
    const result = attempt({ event: 'autoRoute', actor: 'system', facts: atNode3 });

    expect(result).toEqual({ ok: false, refusal: 'R-WRONG-STATUS' });
  });

  it('refuses a submit when a record already exists', () => {
    const result = attempt({ event: 'submit', actor: 'farmer', facts: atNode1 });

    expect(result).toEqual({ ok: false, refusal: 'R-WRONG-STATUS' });
  });
});

describe('closed cases', () => {
  it.each(['Resolved', 'AdminClosed'] as const)('%s accepts no event at all', status => {
    const closed = status === 'Resolved' ? resolved : adminClosed;

    expect(attempt({ event: 'reschedule', actor: 'expert', facts: closed })).toEqual({
      ok: false,
      refusal: 'S-TERMINAL',
    });
    expect(attempt({ event: 'confirmRepair', actor: 'expert', facts: closed })).toEqual({
      ok: false,
      refusal: 'S-TERMINAL',
    });
    expect(attempt({ event: 'farmerRejects', actor: 'farmer', facts: closed })).toEqual({
      ok: false,
      refusal: 'S-TERMINAL',
    });
  });
});
