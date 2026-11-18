import { setLocale } from '@/i18n';

import {
  formatAbsoluteDateTime,
  formatCalendarDay,
  formatRelativeTime,
} from '../relativeTime';

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
  // Built local and round-tripped, so the test is correct on any machine's timezone.
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

// Arabic's plural boundaries are 1/2/3-10/11+; English's is just 1 vs the rest. Both walked here.
describe('formatRelativeTime in English', () => {
  beforeAll(() => setLocale('en'));
  afterAll(() => setLocale('ar'));

  // Spelled out so the non-breaking space is visible — an ordinary one lets Android drop "now".
  const JUST_NOW = 'just now';

  it('reads anything under a minute as just now', () => {
    expect(formatRelativeTime(ago(0), NOW)).toBe(JUST_NOW);
    expect(formatRelativeTime(ago(59), NOW)).toBe(JUST_NOW);
  });

  it('holds that phrase together, because a wrapped one loses its second word', () => {
    expect(formatRelativeTime(ago(0), NOW)).not.toContain(' ');
  });

  it('uses the article rather than the numeral for one', () => {
    expect(formatRelativeTime(ago(MINUTE), NOW)).toBe('a minute ago');
    expect(formatRelativeTime(ago(HOUR), NOW)).toBe('an hour ago');
  });

  it('uses a landmark for one day, week, month and year', () => {
    expect(formatRelativeTime(ago(DAY), NOW)).toBe('yesterday');
    expect(formatRelativeTime(ago(7 * DAY), NOW)).toBe('last week');
    expect(formatRelativeTime(ago(30 * DAY), NOW)).toBe('last month');
    expect(formatRelativeTime(ago(365 * DAY), NOW)).toBe('last year');
  });

  it('has no dual, so two counts like every other plural', () => {
    expect(formatRelativeTime(ago(2 * MINUTE), NOW)).toBe('2 minutes ago');
    expect(formatRelativeTime(ago(2 * DAY), NOW)).toBe('2 days ago');
  });

  it('counts the same either side of the Arabic few/many boundary', () => {
    expect(formatRelativeTime(ago(3 * MINUTE), NOW)).toBe('3 minutes ago');
    expect(formatRelativeTime(ago(10 * MINUTE), NOW)).toBe('10 minutes ago');
    expect(formatRelativeTime(ago(11 * MINUTE), NOW)).toBe('11 minutes ago');
  });

  it('picks the largest unit that fits', () => {
    expect(formatRelativeTime(ago(90 * MINUTE), NOW)).toBe('an hour ago');
    expect(formatRelativeTime(ago(3 * HOUR), NOW)).toBe('3 hours ago');
    expect(formatRelativeTime(ago(21 * DAY), NOW)).toBe('3 weeks ago');
  });

  it('clamps a future timestamp and returns nothing for a malformed one', () => {
    const future = new Date(NOW.getTime() + 5 * 60 * 1000).toISOString();

    expect(formatRelativeTime(future, NOW)).toBe(JUST_NOW);
    expect(formatRelativeTime('not-a-date', NOW)).toBe('');
  });
});

// Pins the boundary itself: 10 takes the plural, 11 reverts to singular — a swapped table would still pass the tests above.
describe('the Arabic few/many boundary', () => {
  it('takes the plural at ten and the singular at eleven', () => {
    expect(formatRelativeTime(ago(10 * MINUTE), NOW)).toBe('منذ 10 دقائق');
    expect(formatRelativeTime(ago(11 * MINUTE), NOW)).toBe('منذ 11 دقيقة');
  });
});

describe('formatCalendarDay', () => {
  afterEach(() => setLocale('ar'));

  // SPEC §12.2: the frame's weekday for this date is wrong on paper — 14 June 2026 really is الأحد.
  it('builds the weekday from the date rather than from a literal', () => {
    expect(formatCalendarDay('2026-06-14')).toBe('الأحد، 14 يونيو');

    setLocale('en');
    expect(formatCalendarDay('2026-06-14')).toBe('Sunday, 14 June');
  });

  // A bare YYYY-MM-DD read as UTC midnight lands on the day before at any negative offset.
  it('reads a bare date as a local calendar day, not as UTC midnight', () => {
    expect(formatCalendarDay('2026-01-01')).toBe('الخميس، 1 يناير');
  });

  it('returns nothing for a malformed date', () => {
    expect(formatCalendarDay('not-a-date')).toBe('');
  });
});

describe('formatAbsoluteDateTime in English', () => {
  beforeAll(() => setLocale('en'));
  afterAll(() => setLocale('ar'));

  it('keeps the Arabic arrangement and swaps only the vocabulary', () => {
    expect(formatAbsoluteDateTime(new Date(2026, 5, 10, 9, 41).toISOString())).toBe(
      'Wednesday, 10 June — 9:41 AM',
    );
    expect(formatAbsoluteDateTime(new Date(2026, 5, 10, 17, 32).toISOString())).toBe(
      'Wednesday, 10 June — 5:32 PM',
    );
  });
});
