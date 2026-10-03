// Arabic counts in three shapes, and skipping the dual is what reads as translated.
type Unit = {
  seconds: number;
  /** "منذ دقيقة" */
  one: string;
  /** "منذ دقيقتين" */
  two: string;
  /** 3 to 10 take the plural, e.g. "3 دقائق" */
  few: string;
  /** 11 and up revert to the singular, e.g. "11 دقيقة" */
  many: string;
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const UNITS: Unit[] = [
  { seconds: YEAR, one: 'سنة', two: 'سنتين', few: 'سنوات', many: 'سنة' },
  { seconds: MONTH, one: 'شهر', two: 'شهرين', few: 'أشهر', many: 'شهراً' },
  { seconds: WEEK, one: 'أسبوع', two: 'أسبوعين', few: 'أسابيع', many: 'أسبوعاً' },
  { seconds: DAY, one: 'يوم', two: 'يومين', few: 'أيام', many: 'يوماً' },
  { seconds: HOUR, one: 'ساعة', two: 'ساعتين', few: 'ساعات', many: 'ساعة' },
  { seconds: MINUTE, one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' },
];

const JUST_NOW = 'الآن';

function pluralize(count: number, unit: Unit): string {
  if (count === 1) {
    return unit.one;
  }
  if (count === 2) {
    return unit.two;
  }
  // 3 to 10 take the plural; 11 and up go back to the singular accusative.
  return count <= 10 ? `${count} ${unit.few}` : `${count} ${unit.many}`;
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

  for (const unit of UNITS) {
    if (elapsed >= unit.seconds) {
      return `منذ ${pluralize(Math.floor(elapsed / unit.seconds), unit)}`;
    }
  }

  return JUST_NOW;
}

// Hand-rolled rather than Intl, same call as the plural table above: full ICU data is not a
// given on Hermes, and §6.7 pins Western numerals throughout regardless of locale behaviour.
const WEEKDAYS = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];
const MONTHS = [
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
];

/** F-06's done-node timestamp: "الثلاثاء، 10 يونيو — 9:41 ص". `null` on a malformed timestamp. */
export function formatAbsoluteDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const weekday = WEEKDAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];

  const hour24 = date.getHours();
  const period = hour24 < 12 ? 'ص' : 'م';
  // 12-hour, no leading zero - "9:41", not "09:41", matching the export.
  const hour12 = hour24 % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${weekday}، ${date.getDate()} ${month} — ${hour12}:${minute} ${period}`;
}
