import type { Locale } from './locale';

/** The four shapes Arabic counts in. §16.7: English uses two of them. */
export type PluralShape = 'one' | 'two' | 'few' | 'many';

/** two and few are optional so an English table declares two fields, not four copies of one string. */
export type PluralForms = {
  one: string;
  two?: string;
  few?: string;
  many: string;
};

/** Hand-rolled rather than Intl.PluralRules: §16.7 pins it, full ICU data is not a given on Hermes. */
export function pluralShape(count: number, locale: Locale): PluralShape {
  if (locale === 'en') {
    return count === 1 ? 'one' : 'many';
  }

  if (count === 1) {
    return 'one';
  }
  if (count === 2) {
    return 'two';
  }

  // 3 to 10 take the plural; 11 and up go back to the singular accusative.
  return count <= 10 ? 'few' : 'many';
}

/** Falls back to many, which is the shape every locale declares. */
export function selectPlural(forms: PluralForms, count: number, locale: Locale): string {
  return forms[pluralShape(count, locale)] ?? forms.many;
}
