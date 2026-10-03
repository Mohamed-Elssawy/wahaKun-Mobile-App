import { dateKey, isWithinWindow, windowDates, WINDOW_LENGTH_DAYS } from '../scheduleWindow';

// No "Z" suffix: parsed as local time, same as every date this module reads.
const FILED_JUNE_28 = '2026-06-28T10:00:00';

describe('windowDates', () => {
  it('is 7 days long, starting on the filing date', () => {
    expect(windowDates(FILED_JUNE_28)).toEqual([
      '2026-06-28',
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
    ]);
  });

  it('matches WINDOW_LENGTH_DAYS', () => {
    expect(windowDates(FILED_JUNE_28)).toHaveLength(WINDOW_LENGTH_DAYS);
  });
});

describe('isWithinWindow', () => {
  it('includes the filing date itself', () => {
    expect(isWithinWindow(FILED_JUNE_28, '2026-06-28')).toBe(true);
  });

  // The boundary is inclusive: day 7 is still selectable.
  it('includes day 7, the last selectable day', () => {
    expect(isWithinWindow(FILED_JUNE_28, '2026-07-04')).toBe(true);
  });

  it('excludes day 8', () => {
    expect(isWithinWindow(FILED_JUNE_28, '2026-07-05')).toBe(false);
  });

  it('excludes the day before filing', () => {
    expect(isWithinWindow(FILED_JUNE_28, '2026-06-27')).toBe(false);
  });
});

describe('dateKey', () => {
  it('pads single-digit months and days', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
