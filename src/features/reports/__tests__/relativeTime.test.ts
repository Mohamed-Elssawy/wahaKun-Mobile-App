import { formatAbsoluteDateTime, formatRelativeTime } from '../relativeTime';

// The dual is what a naive template gets wrong, and F-07 shows all three shapes.
const NOW = new Date('2026-07-28T12:00:00Z');
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000).toISOString();

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatRelativeTime', () => {
  it('reads anything under a minute as now', () => {
    expect(formatRelativeTime(ago(0), NOW)).toBe('الآن');
    expect(formatRelativeTime(ago(59), NOW)).toBe('الآن');
  });

  it('uses the singular for one', () => {
    expect(formatRelativeTime(ago(MINUTE), NOW)).toBe('منذ دقيقة');
    expect(formatRelativeTime(ago(HOUR), NOW)).toBe('منذ ساعة');
    expect(formatRelativeTime(ago(DAY), NOW)).toBe('منذ يوم');
  });

  it('uses the dual for two, rather than a number', () => {
    expect(formatRelativeTime(ago(2 * MINUTE), NOW)).toBe('منذ دقيقتين');
    expect(formatRelativeTime(ago(2 * HOUR), NOW)).toBe('منذ ساعتين');
    expect(formatRelativeTime(ago(2 * DAY), NOW)).toBe('منذ يومين');
  });

  it('uses the plural for three to ten', () => {
    expect(formatRelativeTime(ago(3 * DAY), NOW)).toBe('منذ 3 أيام');
    expect(formatRelativeTime(ago(45 * MINUTE), NOW)).toBe('منذ 45 دقيقة');
  });

  it('picks the largest unit that fits', () => {
    expect(formatRelativeTime(ago(90 * MINUTE), NOW)).toBe('منذ ساعة');
    expect(formatRelativeTime(ago(8 * DAY), NOW)).toBe('منذ أسبوع');
  });

  it('treats a future timestamp as now rather than negative', () => {
    const future = new Date(NOW.getTime() + 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(future, NOW)).toBe('الآن');
  });

  it('returns nothing for an unparseable timestamp', () => {
    expect(formatRelativeTime('not-a-date', NOW)).toBe('');
  });
});

describe('formatAbsoluteDateTime', () => {
  // Built with the local constructor and round-tripped through toISOString(), so the test is
  // correct on any machine's timezone: a (year, month, day) tuple's weekday is TZ-independent,
  // and reading the local getters back out reproduces the same local fields that went in.
  const sample = (hour: number, minute: number) =>
    new Date(2026, 5, 10, hour, minute).toISOString();

  it('matches the §8.2 export: weekday, day, month — hour:minute period', () => {
    expect(formatAbsoluteDateTime(sample(9, 41))).toBe('الأربعاء، 10 يونيو — 9:41 ص');
  });

  it('uses م after noon and drops the leading zero on the hour', () => {
    expect(formatAbsoluteDateTime(sample(17, 32))).toBe('الأربعاء، 10 يونيو — 5:32 م');
  });

  it('reads noon itself as م and midnight as 12 ص', () => {
    expect(formatAbsoluteDateTime(sample(12, 0))).toBe('الأربعاء، 10 يونيو — 12:00 م');
    expect(formatAbsoluteDateTime(sample(0, 0))).toBe('الأربعاء، 10 يونيو — 12:00 ص');
  });

  it('pads single-digit minutes', () => {
    expect(formatAbsoluteDateTime(sample(8, 7))).toBe('الأربعاء، 10 يونيو — 8:07 ص');
  });

  it('returns nothing for an unparseable timestamp', () => {
    expect(formatAbsoluteDateTime('not-a-date')).toBe('');
  });
});
