import { normalizeMapIssue } from '../services/mapService';
import { describeTier, normalizeMapStatus, worstTier } from '../tier';

import type { MapIssueWire } from '../types';

const wire = (overrides: Partial<MapIssueWire> = {}): MapIssueWire => ({
  issueId: 'i-1',
  latitude: '29.2041',
  // Yes, `longitde`: the DTO is missing its `u` and the field name is copied verbatim.
  longitde: '25.5195',
  photoUrl: null,
  createdAt: '2026-08-09T13:01:13.4206342Z',
  priority: 'Critical',
  status: 'Diagnosed',
  title: 'تسريب في القناة',
  ...overrides,
});

describe('normalizeMapIssue', () => {
  it('parses the string coordinates the DTO sends', () => {
    const issue = normalizeMapIssue(wire());

    expect(issue?.latitude).toBeCloseTo(29.2041);
    expect(issue?.longitude).toBeCloseTo(25.5195);
  });

  // An issue with no location cannot be drawn, and guessing one would be worse.
  it('drops an issue the map cannot place', () => {
    expect(normalizeMapIssue(wire({ latitude: null }))).toBeNull();
    expect(normalizeMapIssue(wire({ longitde: null }))).toBeNull();
    expect(normalizeMapIssue(wire({ latitude: '   ' }))).toBeNull();
    expect(normalizeMapIssue(wire({ longitde: 'not-a-number' }))).toBeNull();
  });

  it('points the attachment key at MediaStorageService', () => {
    const issue = normalizeMapIssue(wire({ photoUrl: 'reportimage/a.jpg' }));

    expect(issue?.photoUrl).toContain('/storage?objectName=');
    expect(issue?.photoUrl).toContain('reportimage');
  });

  it('leaves an issue with no attachment without a photo', () => {
    expect(normalizeMapIssue(wire())?.photoUrl).toBeUndefined();
  });

  // datetime2 carries no offset, so a naive timestamp would be read as local time.
  it('marks a timestamp that arrives without a zone as UTC', () => {
    const naive = normalizeMapIssue(wire({ createdAt: '2026-08-09T13:01:13.4206342' }));

    expect(naive?.createdAt.endsWith('Z')).toBe(true);
  });
});

describe('normalizeMapStatus', () => {
  it('reads the names the DTO sends', () => {
    expect(normalizeMapStatus('Diagnosed')).toBe('Diagnosed');
    expect(normalizeMapStatus('Repaired')).toBe('Repaired');
  });

  // IssueStatus 6 is declared `completed` in C#; every other member is capitalised.
  it('passes through the one status the server spells in lower case', () => {
    expect(normalizeMapStatus('completed')).toBe('completed');
  });

  it('falls back rather than throwing when the server grows the enum', () => {
    expect(normalizeMapStatus('Escalated')).toBe('Reported');
  });
});

describe('describeTier', () => {
  it('collapses the priority names onto the legend’s four rows', () => {
    expect(describeTier('Critical', 'Diagnosed')).toBe('critical');
    expect(describeTier('High', 'Diagnosed')).toBe('critical');
    expect(describeTier('Medium', 'Diagnosed')).toBe('medium');
    expect(describeTier('Low', 'Diagnosed')).toBe('low');
    expect(describeTier('Unknown', 'Diagnosed')).toBe('low');
  });

  // Map's enum stops at 3 and ReportService writes Critical as 4, so the number arrives as text.
  it('reads the bare numbers the enum mismatch puts on the wire', () => {
    expect(describeTier('4', 'Diagnosed')).toBe('critical');
    expect(describeTier('3', 'Diagnosed')).toBe('critical');
    expect(describeTier('2', 'Diagnosed')).toBe('medium');
    expect(describeTier('1', 'Diagnosed')).toBe('low');
  });

  it('reads a closed problem as resolved whatever its severity was', () => {
    expect(describeTier('4', 'completed')).toBe('resolved');
  });

  // T6 leaves a repaired case at مجدولة: the pin only goes green once the farmer confirms,
  // because until then the problem may still be there.
  it('keeps the severity of a repaired case the farmer has not confirmed', () => {
    expect(describeTier('Critical', 'Repaired')).toBe('critical');
  });

  it('falls back to low for a priority it does not know', () => {
    expect(describeTier('Catastrophic', 'Diagnosed')).toBe('low');
  });
});

describe('worstTier', () => {
  // A cluster takes the worst tier it holds, so nothing critical hides behind a safe-looking count.
  it('takes the most severe tier in the group', () => {
    expect(worstTier(['low', 'critical', 'medium'])).toBe('critical');
    expect(worstTier(['resolved', 'medium'])).toBe('medium');
    expect(worstTier(['resolved'])).toBe('resolved');
  });

  it('falls back to low when given nothing', () => {
    expect(worstTier([])).toBe('low');
  });
});
