import { describeSeverity, isCriticalSeverity } from '../severity';

import type { Severity } from '../types';

// Listed literally, not derived from the tier table, so deleting a case fails here.
const ALL: Severity[] = [
  'Unknown',
  'Negligible',
  'VeryMinor',
  'Minor',
  'Low',
  'Medium',
  'High',
  'VeryHigh',
  'Critical',
  'VeryCritical',
];

describe('describeSeverity', () => {
  it('maps every value the backend enum can hold', () => {
    for (const severity of ALL) {
      expect(describeSeverity(severity).label).toBeTruthy();
    }
  });

  it('collapses the ten levels onto three tiers plus unknown', () => {
    const labels = new Set(ALL.map(severity => describeSeverity(severity).label));

    expect(labels).toEqual(new Set(['حرجة', 'متوسطة', 'منخفضة', 'غير معروفة']));
  });

  // The product decision, pinned: warning late costs more than warning early.
  it('treats High and VeryHigh as critical, not medium', () => {
    expect(describeSeverity('High').label).toBe('حرجة');
    expect(describeSeverity('VeryHigh').label).toBe('حرجة');
  });

  it('does not claim an unanalysable photo is safe', () => {
    expect(describeSeverity('Unknown').label).toBe('غير معروفة');
    expect(describeSeverity('Unknown').color).toBe('disabled');
  });

  // The server can grow an enum value first, and rendering nothing is worse.
  it('falls back rather than returning undefined for a value it has never seen', () => {
    expect(describeSeverity('Catastrophic' as Severity).label).toBe('غير معروفة');
  });
});

describe('isCriticalSeverity', () => {
  // Filter and badge read the same table, so the two cannot disagree.
  it('agrees with the badge on which reports are critical', () => {
    for (const severity of ALL) {
      expect(isCriticalSeverity(severity)).toBe(
        describeSeverity(severity).label === 'حرجة',
      );
    }
  });
});
