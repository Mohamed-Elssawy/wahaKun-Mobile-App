import { formatRelativeTime } from '../relativeTime';

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
