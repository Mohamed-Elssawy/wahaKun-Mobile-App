/**
 * §8.3's `C-WINDOW`: only the 7 days starting at the filing date are selectable on E-03. Dates
 * are local-calendar-day keys ("YYYY-MM-DD"), matching how the rest of the app already renders
 * absolute time (`relativeTime.ts`'s `Date.getDate()`/`getMonth()` calls) rather than UTC - the
 * window is anchored to whatever day the device clock says the report was filed on.
 */

export const WINDOW_LENGTH_DAYS = 7;

/** Local calendar-day key, not UTC: two devices in different timezones can disagree on it for
 * the same instant, same as every other local-time read in this app. */
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
  return Array.from({ length: WINDOW_LENGTH_DAYS }, (_, index) => dateKey(addDays(start, index)));
}

/** What `ScheduleCalendar` disables a day cell on. */
export function isWithinWindow(filingIso: string, candidate: string): boolean {
  return windowDates(filingIso).includes(candidate);
}
