import { FORCE_LOCALE } from '@/config/env';

import { applyDirection, directionFor } from './direction';
import { readStoredLocale } from './storage';

import type { Direction } from './direction';

/** §16.1: two locales and no third. The pseudo-locale is a transform on 'en', not a member. */
export type Locale = 'ar' | 'en';

// Synchronous at module init, so theme/typography.ts can resolve the right family before the first StyleSheet.create.
let active: Locale = FORCE_LOCALE === 'pseudo' ? 'en' : (FORCE_LOCALE ?? 'ar');

// A property of the whole run, not of the active locale, so setLocale never clears it.
const pseudo = FORCE_LOCALE === 'pseudo';

/** A function, not a const: a const would capture its value before the persisted locale arrives in the boot window. */
export function locale(): Locale {
  return active;
}

/** True only under FORCE_LOCALE 'pseudo'. t() then reads ar.json and pseudoizes every result. */
export function isPseudo(): boolean {
  return pseudo;
}

export function direction(): Direction {
  return directionFor(active);
}

export function isRTL(): boolean {
  return direction() === 'rtl';
}

/** The store only. §16.5 persists first and keeps its own failure path, so storeLocale is separate. */
export function setLocale(next: Locale): void {
  active = next;
}

/** Resolved once, in App.tsx's splash window, before the first screen mounts (§16.2). */
export async function resolveLocale(): Promise<Locale> {
  // A set override wins outright and was already applied above, so storage is not even read.
  if (!FORCE_LOCALE) {
    active = (await readStoredLocale()) ?? 'ar';
  }

  applyDirection(active);

  return active;
}
