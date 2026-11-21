import {
  describeSeverity,
  isCriticalSeverity,
  reportSeverity,
  severityFromPriority,
} from '../severity';

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

describe('severityFromPriority', () => {
  it.each([
    ['Critical', 'حرجة'],
    ['High', 'عالية'],
    ['Medium', 'متوسطة'],
    ['Low', 'منخفضة'],
  ])('reads IssuePriority %s as %s', (priority, expected) => {
    expect(severityFromPriority(priority)).toBe(expected);
  });

  // GetPriority answers Unknown for anything it does not recognise, and so does this.
  it('falls back rather than inventing a level', () => {
    expect(severityFromPriority('Catastrophic')).toBe('غير معروفة');
  });
});

/** The rule F-07's card border, F-06's border and B-CRIT-TAB all paint from. */
describe('reportSeverity', () => {
  const base = {
    id: 'i-1',
    status: 'Assigned',
    createdAt: '2026-10-05T19:47:30Z',
    reporterId: 'r-1',
    attachments: [],
  } as const;

  const withAnalysis = { ...base, analysis: { severity: 'متوسطة' } } as never;

  // T2 hides AI output below the threshold, and severity is AI output.
  it('prefers the model, and hides it when the farmer may not see it', () => {
    expect(reportSeverity(withAnalysis, true)).toBe('متوسطة');
    expect(reportSeverity(withAnalysis, false)).toBeUndefined();
  });

  // seesAi is false for a بلاغاتي row either way, so the row's own priority answers here.
  it('falls back to the row priority when there is no analysis to gate on', () => {
    const row = { ...base, severity: 'حرجة' } as never;

    expect(reportSeverity(row, false)).toBe('حرجة');
    expect(reportSeverity(row, true)).toBe('حرجة');
  });

  it('has nothing to paint when the report carries neither', () => {
    expect(reportSeverity(base as never, true)).toBeUndefined();
  });
});
