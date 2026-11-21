import ar from './ar.json';
import en from './en.json';
import { isPseudo, locale } from './locale';
import { pluralShape } from './plural';
import { AR_TO_EN_EXPANSION, EN_PADDING, keyLabel, pseudoize } from './pseudo';

import type { Locale } from './locale';
import type { PluralShape } from './plural';

type Vars = Record<string, string | number>;

const CATALOGUES: Record<Locale, Record<string, string>> = { ar, en };

type CatalogueKey = keyof typeof ar;

/** keyof {} is never, so an empty catalogue widens to string; the tuple wrapper stops never from distributing. */
export type TranslationKey = [CatalogueKey] extends [never] ? string : CatalogueKey;

/** 'reports.queuedCount' from 'reports.queuedCount.one'. Non-plural keys yield never. */
type StemOf<Key> = Key extends `${infer Stem}.${PluralShape}` ? Stem : never;

type CatalogueStem = StemOf<CatalogueKey>;

/** Derived from the catalogue so there's no second list to keep in step; scripts/i18n-check.js guards the textual edge case. */
export type PluralKey = [CatalogueStem] extends [never] ? string : CatalogueStem;

/** {braces}. An unknown placeholder is left verbatim rather than printing "undefined". */
function interpolate(template: string, vars?: Vars): string {
  if (!vars) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in vars ? String(vars[name]) : placeholder,
  );
}

function pseudoFor(key: string, vars?: Vars): string {
  const english = CATALOGUES.en[key];

  if (english !== undefined) {
    const text = interpolate(english, vars);

    return pseudoize(text, Math.ceil(text.length * EN_PADDING));
  }

  // No English yet: the key's leaf stands in, sized from the Arabic it will have to replace.
  const label = keyLabel(key);
  const arabic = CATALOGUES.ar[key];

  return pseudoize(label, Math.ceil((arabic ?? label).length * AR_TO_EN_EXPANSION));
}

/** A plain function, not a hook: §16.5 relaunches on a language change, so nothing here needs to be reactive. */
export function t(key: TranslationKey, vars?: Vars): string {
  const address = key as string;

  if (isPseudo()) {
    return pseudoFor(address, vars);
  }

  // __DEV__ returns the key so a miss is loud; release falls back to Arabic, never a raw key.
  const hit =
    CATALOGUES[locale()][address] ?? (__DEV__ ? undefined : CATALOGUES.ar[address]);

  return hit === undefined ? address : interpolate(hit, vars);
}

/** t() for a named locale: the relaunch screen is written in the language switched TO, which the reader may not know yet. */
export function tIn(target: Locale, key: TranslationKey, vars?: Vars): string {
  const hit = CATALOGUES[target][key as string];

  return hit === undefined ? (key as string) : interpolate(hit, vars);
}

/** The catalogue half of plural.ts: serves a family of keys (one through many), where selectPlural() serves code tables. */
export function tPlural(stem: PluralKey, count: number, vars?: Vars): string {
  const shape = pluralShape(count, locale());

  return t(`${stem}.${shape}` as TranslationKey, { count, ...vars });
}
