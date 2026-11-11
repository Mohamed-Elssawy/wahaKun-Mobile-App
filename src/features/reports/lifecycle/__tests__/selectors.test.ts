import { currentNode, LIFECYCLE_NODES } from '../nodes';
import {
  canCorroborate,
  expertCtaFor,
  isChatWritable,
  isComposerHidden,
  publicStepperNode,
} from '../selectors';
import { LIFECYCLE_STATUSES } from '../statuses';
import {
  adminClosed,
  atNode1,
  atNode2,
  atNode3,
  atNode4,
  atNode5,
  atNode6,
  EVERY_NODE,
  reopened,
  resolved,
} from './fixtures';

describe('currentNode', () => {
  it('places every one of the six nodes', () => {
    expect(EVERY_NODE.map(currentNode)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('puts a reopened case back at node 3, because T8 cleared 4 and 5', () => {
    expect(currentNode(reopened)).toBe(3);
  });

  it('leaves a closed case at node 6', () => {
    expect(currentNode(resolved)).toBe(6);
    expect(currentNode(adminClosed)).toBe(6);
  });
});

describe('publicStepperNode', () => {
  it.each([
    [atNode1, 1, []],
    [atNode2, 2, [1]],
    [atNode3, 3, [1, 2]],
    [atNode4, 4, [1, 2, 3]],
    [atNode5, 5, [1, 2, 3, 4]],
    [atNode6, 6, [1, 2, 3, 4, 5]],
  ])('draws node %#+1 with the nodes before it complete', (facts, current, completed) => {
    const view = publicStepperNode(facts);

    expect(view.current).toBe(current);
    expect(view.completed).toEqual(completed);
    expect(view.cleared).toEqual([]);
    expect(view.isClosed).toBe(false);
  });

  it('blanks nodes 4 and 5 on a reopen rather than merely unticking them', () => {
    const view = publicStepperNode(reopened);

    expect(view.current).toBe(3);
    expect(view.completed).toEqual([1, 2]);
    expect(view.cleared).toEqual([4, 5]);
    expect(view.isClosed).toBe(false);
  });

  it('ticks all six nodes once the case closes', () => {
    expect(publicStepperNode(resolved)).toEqual({
      current: 6,
      completed: [1, 2, 3, 4, 5, 6],
      cleared: [],
      isClosed: true,
    });
  });

  // §3.2: مغلقة إدارياً renders as تم الحل, so the farmer cannot tell the two apart.
  it('draws an Admin closure exactly as it draws تم الحل', () => {
    expect(publicStepperNode(adminClosed)).toEqual(publicStepperNode(resolved));
  });

  it('never reports a node outside §3.3', () => {
    [...EVERY_NODE, reopened, resolved, adminClosed].forEach(facts => {
      expect(LIFECYCLE_NODES).toContain(publicStepperNode(facts).current);
    });
  });
});

describe('expertCtaFor', () => {
  it('answers for every status in §3.2', () => {
    const answered = LIFECYCLE_STATUSES.map(status =>
      expertCtaFor({ ...atNode1, status }),
    );

    expect(answered).toHaveLength(LIFECYCLE_STATUSES.length);
    answered.forEach(cta => expect(cta.screen).toMatch(/^E-0[23456]$/));
  });

  it('sends a new case to review', () => {
    expect(expertCtaFor(atNode2)).toEqual({ action: 'review', screen: 'E-02' });
  });

  it('sends a reopened case to E-02 pre-filled', () => {
    expect(expertCtaFor(reopened)).toEqual({
      action: 'review',
      screen: 'E-02',
      state: 'reopened',
    });
  });

  it('splits قيد المراجعة on whether the review is finished', () => {
    expect(expertCtaFor(atNode3)).toEqual({ action: 'continue', screen: 'E-02' });
    expect(expertCtaFor(atNode4)).toEqual({ action: 'continue', screen: 'E-03' });
  });

  it('splits مجدولة on whether the repair is published', () => {
    expect(expertCtaFor(atNode5)).toMatchObject({ action: 'view', screen: 'E-04' });
    expect(expertCtaFor(atNode6)).toMatchObject({ action: 'view', screen: 'E-05' });
  });

  // §8.3: rescheduling is entered from the inbox card, not from inside the case.
  it('offers إعادة الجدولة on مجدولة cards and nowhere else', () => {
    expect(expertCtaFor(atNode5).secondaryAction).toBe('reschedule');
    expect(expertCtaFor(atNode6).secondaryAction).toBe('reschedule');

    expect(expertCtaFor(atNode3).secondaryAction).toBeUndefined();
    expect(expertCtaFor(reopened).secondaryAction).toBeUndefined();
    expect(expertCtaFor(resolved).secondaryAction).toBeUndefined();
  });

  it('sends both kinds of closed case to E-06', () => {
    expect(expertCtaFor(resolved)).toEqual({ action: 'view', screen: 'E-06' });
    expect(expertCtaFor(adminClosed)).toEqual({ action: 'view', screen: 'E-06' });
  });
});

describe('canCorroborate', () => {
  it('refuses the reporter their own report', () => {
    expect(canCorroborate(atNode3, { isOwner: true })).toBe(false);
  });

  it('allows another farmer on an open case', () => {
    expect(canCorroborate(atNode3, { isOwner: false })).toBe(true);
  });

  it('refuses a settled case', () => {
    expect(canCorroborate(resolved, { isOwner: false })).toBe(false);
    expect(canCorroborate(adminClosed, { isOwner: false })).toBe(false);
  });
});

describe('the chat and the comment composer', () => {
  it('keeps both open while the case is open', () => {
    expect(isChatWritable('Scheduled')).toBe(true);
    expect(isComposerHidden('Scheduled')).toBe(false);
    expect(isChatWritable('Reopened')).toBe(true);
  });

  it('closes both when the case closes, however it closed', () => {
    expect(isChatWritable('Resolved')).toBe(false);
    expect(isComposerHidden('Resolved')).toBe(true);
    expect(isChatWritable('AdminClosed')).toBe(false);
    expect(isComposerHidden('AdminClosed')).toBe(true);
  });
});
