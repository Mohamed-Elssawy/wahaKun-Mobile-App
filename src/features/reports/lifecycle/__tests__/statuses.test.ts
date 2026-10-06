import { currentNode, factsFromWireStatus, STATUS_FOR_NODE } from '../nodes';
import {
  fromWireStatus,
  isClosedStatus,
  LIFECYCLE_STATUSES,
  UNREPRESENTABLE_ON_THE_WIRE,
} from '../statuses';

import type { ReportStatus } from '../../types';

/** Every IssueStatus value, so a new one on the server shows up here as a failure. */
const WIRE_STATUSES: readonly ReportStatus[] = [
  'Reported',
  'Diagnosed',
  'Verified',
  'Assigned',
  'Reviewed',
  'Scheduled',
  'Repaired',
  'completed',
];

describe('ReportService IssueStatus onto §3.2', () => {
  it.each([
    ['Reported', 'New'],
    ['Diagnosed', 'New'],
    // Verified has no §3.2 home at all; nothing in §3.5 verifies before routing.
    ['Verified', 'New'],
    ['Assigned', 'UnderReview'],
    // The expert's own review submission. Same lifecycle bucket as Assigned - node 3 vs 4
    // is only distinguished by factsFromWireStatus's hasExpertReview, not by this map.
    ['Reviewed', 'UnderReview'],
    ['Scheduled', 'Scheduled'],
    // The one that was wrong before: T6 leaves the status at مجدولة, so this is node 6, not closed.
    ['Repaired', 'Scheduled'],
    // Lowercase on the wire - the one that was wrong before.
    ['completed', 'Resolved'],
  ] as const)('maps %s to %s', (wire, lifecycle) => {
    expect(fromWireStatus(wire)).toBe(lifecycle);
  });

  it('maps every wire value to a status in §3.2', () => {
    WIRE_STATUSES.forEach(wire => {
      expect(LIFECYCLE_STATUSES).toContain(fromWireStatus(wire));
    });
  });

  it('falls back rather than throwing on a value the server grew first', () => {
    expect(fromWireStatus('Escalated' as ReportStatus)).toBe('New');
  });

  it('records the two statuses IssueStatus cannot express', () => {
    expect(UNREPRESENTABLE_ON_THE_WIRE).toEqual(['Reopened', 'AdminClosed']);

    UNREPRESENTABLE_ON_THE_WIRE.forEach(status => {
      expect(WIRE_STATUSES.map(fromWireStatus)).not.toContain(status);
    });
  });
});

describe('factsFromWireStatus', () => {
  it('places a bare Repaired row at node 6, not at a closed case', () => {
    const facts = factsFromWireStatus('Repaired');

    expect(facts.status).toBe('Scheduled');
    expect(currentNode(facts)).toBe(6);
  });

  it('places a bare Reported row at node 1 and a Diagnosed row at node 2', () => {
    expect(currentNode(factsFromWireStatus('Reported'))).toBe(1);
    expect(currentNode(factsFromWireStatus('Diagnosed'))).toBe(2);
  });

  // No IssueStatus value distinguishes node 3 from node 4, so the wire can only ever say 3.
  it('cannot reach node 4 from a wire status alone', () => {
    const facts = factsFromWireStatus('Assigned');

    expect(facts.hasExpertReview).toBe(false);
    expect(currentNode(facts)).toBe(3);
  });

  it('closes a completed row', () => {
    expect(isClosedStatus(factsFromWireStatus('completed').status)).toBe(true);
  });

  it('is the only wire value that sets hasExpertReview', () => {
    expect(factsFromWireStatus('Reviewed').hasExpertReview).toBe(true);
    expect(currentNode(factsFromWireStatus('Reviewed'))).toBe(4);
  });
});

describe('§3.3 node map', () => {
  it('pairs the six nodes with the statuses §3.3 gives them', () => {
    expect(STATUS_FOR_NODE).toEqual({
      1: 'New',
      2: 'New',
      3: 'UnderReview',
      4: 'UnderReview',
      5: 'Scheduled',
      6: 'Scheduled',
    });
  });

  it('agrees with currentNode on every node it maps', () => {
    expect(isClosedStatus('Resolved')).toBe(true);
    expect(isClosedStatus('AdminClosed')).toBe(true);
    expect(isClosedStatus('Reopened')).toBe(false);
  });
});
