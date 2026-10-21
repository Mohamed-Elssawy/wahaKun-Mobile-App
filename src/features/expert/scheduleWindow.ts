/** C-WINDOW: the 7 days from the filing date, keyed by local calendar day rather than UTC. */

export const WINDOW_LENGTH_DAYS = 7;

/** Local calendar-day key: two devices in different zones can disagree for the same instant. */
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The 7 selectable date keys, filing day first. */
export function windowDates(filingIso: string): string[] {
  const start = new Date(filingIso);
  return Array.from({ length: WINDOW_LENGTH_DAYS }, (_, index) =>
    dateKey(addDays(start, index)),
  );
}

/** What `ScheduleCalendar` disables a day cell on. */
export function isWithinWindow(filingIso: string, candidate: string): boolean {
  return windowDates(filingIso).includes(candidate);
}

/** -u-nu-latn is §6.7: ar-EG alone numbers the day in Arabic-Indic digits. */
export function formatSlotDay(date: string): string {
  return new Date(date).toLocaleDateString('ar-EG-u-nu-latn', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
