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
