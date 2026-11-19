// Imports from config/ only; nothing here may import from features/ - ARCHITECTURE.md rule 1.

export {
  applyDirection,
  contentIsolate,
  detectDirection,
  directionFor,
  ltrIsolate,
} from './direction';
export type { Direction } from './direction';

export { direction, isPseudo, isRTL, locale, resolveLocale, setLocale } from './locale';
export type { Locale } from './locale';

export { pluralShape, selectPlural } from './plural';
export type { PluralForms, PluralShape } from './plural';

export { storeLocale } from './storage';

export { t, tIn, tPlural } from './t';
export type { PluralKey, TranslationKey } from './t';
