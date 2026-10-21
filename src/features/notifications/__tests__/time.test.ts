import { formatNotificationTime, groupFor } from '../time';

describe('groupFor', () => {
  // Calendar-day, not elapsed hours: a row from just before midnight is yesterday minutes later.
  it('treats 23:59 read at 00:05 the next day as yesterday, not today', () => {
    const createdAt = new Date(2026, 5, 9, 23, 59).toISOString();
    const now = new Date(2026, 5, 10, 0, 5);

    expect(groupFor(createdAt, now)).toBe('yesterday');
  });

  it('treats 00:01 read later the same day as today, even hours later', () => {
    const createdAt = new Date(2026, 5, 10, 0, 1).toISOString();
    const now = new Date(2026, 5, 10, 23, 0);

    expect(groupFor(createdAt, now)).toBe('today');
  });

  it('crosses a month edge as one calendar day, not a jump to lastWeek', () => {
    const createdAt = new Date(2026, 0, 31, 22, 0).toISOString(); // 31 Jan
    const now = new Date(2026, 1, 1, 6, 0); // 1 Feb

    expect(groupFor(createdAt, now)).toBe('yesterday');
  });

  it('buckets anything two or more calendar days back as lastWeek, open-ended', () => {
    const createdAt = new Date(2026, 0, 1, 12, 0).toISOString();
    const now = new Date(2026, 5, 10, 12, 0);

    expect(groupFor(createdAt, now)).toBe('lastWeek');
  });
});

describe('formatNotificationTime', () => {
  const now = new Date(2026, 5, 10, 14, 0);

  it('reads a today row as relative time', () => {
    const createdAt = new Date(2026, 5, 10, 13, 40).toISOString();

    expect(formatNotificationTime(createdAt, now)).toBe('منذ 20 دقيقة');
  });

  it('reads a yesterday row as أمس plus 12-hour time, no leading zero', () => {
    const createdAt = new Date(2026, 5, 9, 17, 32).toISOString();

    expect(formatNotificationTime(createdAt, now)).toBe('أمس، 5:32 م');
  });

  it('reads a lastWeek row as weekday and date, with no time at all', () => {
    const createdAt = new Date(2026, 5, 6, 9, 0).toISOString(); // Saturday 6 June

    expect(formatNotificationTime(createdAt, now)).toBe('السبت، 6 يونيو');
  });
});
