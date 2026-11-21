// The app's formatter vocabulary, both locales, hand-rolled. SPEC §16.7 keeps it in code rather
// than in a catalogue, which is why .eslintrc.js exempts this file from the Arabic-literal rule.
import { locale, selectPlural, t } from '@/i18n';
import type { Locale, PluralForms } from '@/i18n';

/** Both locales on one row, so the tables cannot drift out of unit order against each other. */
type UnitRow = { seconds: number; ar: PluralForms; en: PluralForms };

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

// Arabic counts in four shapes and skipping the dual is what reads as translated; English counts
// in two. Each form is the whole output, the way a catalogue holds it - English's `one` forms are
// landmarks (yesterday, last week) with no prefix or suffix a terser table could factor out.
const UNITS: UnitRow[] = [
  {
    seconds: YEAR,
    ar: {
      one: 'منذ سنة',
      two: 'منذ سنتين',
      few: 'منذ {count} سنوات',
      many: 'منذ {count} سنة',
    },
    en: { one: 'last year', many: '{count} years ago' },
  },
  {
    seconds: MONTH,
    ar: {
      one: 'منذ شهر',
      two: 'منذ شهرين',
      few: 'منذ {count} أشهر',
      many: 'منذ {count} شهراً',
    },
    en: { one: 'last month', many: '{count} months ago' },
  },
  {
    seconds: WEEK,
    ar: {
      one: 'منذ أسبوع',
      two: 'منذ أسبوعين',
      few: 'منذ {count} أسابيع',
      many: 'منذ {count} أسبوعاً',
    },
    en: { one: 'last week', many: '{count} weeks ago' },
  },
  {
    seconds: DAY,
    ar: {
      one: 'منذ يوم',
      two: 'منذ يومين',
      few: 'منذ {count} أيام',
      many: 'منذ {count} يوماً',
    },
    en: { one: 'yesterday', many: '{count} days ago' },
  },
  {
    seconds: HOUR,
    ar: {
      one: 'منذ ساعة',
      two: 'منذ ساعتين',
      few: 'منذ {count} ساعات',
      many: 'منذ {count} ساعة',
    },
    en: { one: 'an hour ago', many: '{count} hours ago' },
  },
  {
    seconds: MINUTE,
    ar: {
      one: 'منذ دقيقة',
      two: 'منذ دقيقتين',
      few: 'منذ {count} دقائق',
      many: 'منذ {count} دقيقة',
    },
    en: { one: 'a minute ago', many: '{count} minutes ago' },
  },
];

/**
 * The space is U+00A0. Android measures this phrase's desired width, rounds it to an integer,
 * then re-wraps the text inside that rounded width - which is a hair narrower than the glyphs
 * actually need, so "now" breaks to a second line. On E-09's comment timestamp the row is one
 * line tall, so that second line is clipped and the word is simply gone. A non-breaking space
 * is also what the phrase means: it is one label, and it should never break across lines.
 * Measured on device: of every English form here, only this one lands on the rounding boundary.
 */
const JUST_NOW: Record<Locale, string> = { ar: 'الآن', en: 'just now' };

/** String(count) is always Western digits, which is how §6.7's L-NO-DIGITS holds by construction. */
function withCount(template: string, count: number): string {
  return template.replace(/\{count\}/g, String(count));
}

/** `now` is injectable so this can be tested without freezing the clock. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  // A malformed timestamp should not put "NaN" in front of the farmer.
  if (Number.isNaN(then)) {
    return '';
  }

  // Clamped at zero, so clock skew reads as "just now" and never as a future report.
  const elapsed = Math.max((now.getTime() - then) / 1000, 0);
  const active = locale();

  for (const unit of UNITS) {
    if (elapsed >= unit.seconds) {
      const count = Math.floor(elapsed / unit.seconds);
      return withCount(selectPlural(unit[active], count, active), count);
    }
  }

  return JUST_NOW[active];
}

const WEEKDAY_NAMES: Record<Locale, readonly string[]> = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

// Not a slice of the full names: every Arabic one starts with ال, so a slice returns ال seven
// times. English repeats T and S, which is correct for English: the mockup layer settled it in
// its E-03 calendar rows, and the gate against naming that file here is why this cites no path.
const SHORT_WEEKDAY_NAMES: Record<Locale, readonly string[]> = {
  ar: ['ح', 'ن', 'ت', 'ر', 'خ', 'ج', 'س'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

const MONTH_NAMES: Record<Locale, readonly string[]> = {
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

/**
 * E3 served these three from local tables because it could seed no catalogue key - seeding
 * even one would have closed E1's `[CatalogueKey] extends [never]` escape hatch and broken
 * every t() call E4 had yet to write. It listed them as rows E6 swaps for t(), and this is
 * that swap: common.am, common.pm and common.yesterday are released the moment ChatThreadRow
 * leaves the pending list, because that is the file:line the deck recorded them against.
 *
 * Both reads were already inside function bodies, so there is no module-scope hazard here;
 * this file is the extractor's and ESLint's one exemption, which is why it never appeared on
 * the pending list and why its rows had to be chased from the catalogue side instead.
 */
function dayPeriod(hour24: number): string {
  return hour24 < 12 ? t('common.am') : t('common.pm');
}

/** common.yesterday, shared by S-06's group header and E-09's row. */
export function yesterdayLabel(): string {
  return t('common.yesterday');
}

/** The deck's s06.yesterdayAt: the label, the locale's own comma, then the time. */
export function formatYesterdayAt(date: Date): string {
  const hour24 = date.getHours();

  return t('s06.yesterdayAt', {
    hour12: hour24 % 12 || 12,
    minute: String(date.getMinutes()).padStart(2, '0'),
    period: dayPeriod(hour24),
  });
}

/** E-03's calendar column headings. */
export function shortWeekdays(): readonly string[] {
  return SHORT_WEEKDAY_NAMES[locale()];
}

/** E-03's month navigator: the year is digits, so it needs no separator in either locale. */
export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[locale()][date.getMonth()]} ${date.getFullYear()}`;
}

/** The deck's approved s06.dateLong: `الأحد، 14 يونيو` and `Sunday, 14 June`. */
export function formatCalendarDate(date: Date): string {
  const active = locale();

  // The weekday and month NAMES stay local tables: E3 recorded that they carry no deck rows
  // and are waiting on nothing. Only the assembly is a catalogue string, which is what gives
  // each locale its own comma.
  return t('s06.dateLong', {
    weekdays: WEEKDAY_NAMES[active][date.getDay()],
    getDate: date.getDate(),
    months: MONTH_NAMES[active][date.getMonth()],
  });
}

/**
 * A wall-clock "HH:MM" from the wire, which carries no date and so cannot go through a Date.
 * Same 12-hour shape as formatTimeOfDay, and the same day-period table, so ar reads ص/م and en
 * reads AM/PM. Anything that is not HH:MM passes through untouched rather than being mangled.
 */
export function formatClockTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return value;
  }

  const hour24 = Number(match[1]);

  return `${hour24 % 12 || 12}:${match[2]} ${dayPeriod(hour24)}`;
}

/** 12-hour, no leading zero - "9:41", not "09:41", matching the export. */
export function formatTimeOfDay(date: Date): string {
  const hour24 = date.getHours();
  const hour12 = hour24 % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${hour12}:${minute} ${dayPeriod(hour24)}`;
}

// A bare YYYY-MM-DD is a calendar day, not an instant: `new Date` reads it as UTC midnight, which
// is the day before in any negative offset, and a shifted day prints the wrong weekday.
const CALENDAR_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDate(value: string): Date | null {
  const day = CALENDAR_DAY.exec(value);
  const date = day
    ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** F-06/F-07's appointment date and E-03's day label. Empty on a malformed value. */
export function formatCalendarDay(value: string): string {
  const date = parseDate(value);

  return date ? formatCalendarDate(date) : '';
}

/** F-06's done-node timestamp. Empty on a malformed timestamp. */
export function formatAbsoluteDateTime(iso: string): string {
  const date = parseDate(iso);

  return date ? `${formatCalendarDate(date)} — ${formatTimeOfDay(date)}` : '';
}
