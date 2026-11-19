import AsyncStorage from '@react-native-async-storage/async-storage';

import { FORCE_LANGUAGE_FAILURE } from '@/config/env';

import type { Locale } from './locale';

const KEY = 'wk.i18n.locale';

/** §16.2: a failed read falls through to Arabic and still boots. It never blocks. */
export async function readStoredLocale(): Promise<Locale | null> {
  try {
    const stored = await AsyncStorage.getItem(KEY);

    // Anything else is a locale this build no longer has, so it reads as absent.
    return stored === 'ar' || stored === 'en' ? stored : null;
  } catch {
    return null;
  }
}

/** Throws on purpose: §16.5 leaves the active locale untouched when the write fails. */
export async function storeLocale(locale: Locale): Promise<void> {
  // Dev-only, from the gitignored env.local.ts: S-12's persistence-failure state has no mock to produce it.
  if (FORCE_LANGUAGE_FAILURE === 'persist') {
    throw new Error('FORCE_LANGUAGE_FAILURE: persist');
  }

  await AsyncStorage.setItem(KEY, locale);
}
