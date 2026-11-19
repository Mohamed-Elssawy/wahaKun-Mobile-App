import { I18nManager } from 'react-native';

import type { Locale } from './locale';

export type Direction = 'rtl' | 'ltr';

/** §16.3: direction is a consequence of the locale, never a setting of its own. */
export function directionFor(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** L-CONTENT-ALIGN: first-strong-character heuristic, deliberately not a majority rule, which Arabic-quoting-Latin would reverse. */
const FIRST_STRONG = /([A-Za-zÀ-ÖØ-öø-ʯ])|([ؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۿݐ-ݿࢠ-ࢽﭐ-﷿ﹰ-ﻼ])/;

export function detectDirection(text: string): Direction | null {
  const match = FIRST_STRONG.exec(text);

  if (!match) {
    return null;
  }
  return match[1] ? 'ltr' : 'rtl';
}
// FSI opens an isolate resolved by its first strong character, PDI closes it; named since both are invisible in source.
const FIRST_STRONG_ISOLATE = '\u2068';
const POP_ISOLATE = '\u2069';

function isolate(value: string | number): string {
  return `${FIRST_STRONG_ISOLATE}${value}${POP_ISOLATE}`;
}

/** Wraps a §6.7 LTR island (phone number, ID, timer) interpolated into Arabic text, so it can't migrate direction. */
export function ltrIsolate(value: string | number): string {
  return isolate(value);
}

/** Same primitive for L-AS-AUTHORED content spliced into a chrome sentence running the other way; BiText owns whole blocks. */
export function contentIsolate(value: string): string {
  return isolate(value);
}

/** Hands direction to the platform (§16.3); returns nothing deliberately — E7 found no boot state that renders mis-mirrored. */
export function applyDirection(locale: Locale): void {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(locale === 'ar');
}
