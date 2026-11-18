/** Exposes clipping and untranslated strings; never emits non-Latin, since a tofu box has none of the real text's width. */

/** §E's Arabic-to-English expansion. D5 corrects it from what the pass actually finds. */
export const AR_TO_EN_EXPANSION = 1.35;

/** What an English string gets once it exists, since it is already the right language. */
export const EN_PADDING = 1.3;

const ACCENTS: Record<string, string> = {
  a: 'à',
  c: 'ç',
  d: 'ď',
  e: 'é',
  g: 'ğ',
  h: 'ĥ',
  i: 'í',
  j: 'ĵ',
  k: 'ķ',
  l: 'ł',
  n: 'ń',
  o: 'ó',
  p: 'þ',
  r: 'ŕ',
  s: 'ś',
  t: 'ť',
  u: 'ú',
  w: 'ŵ',
  y: 'ý',
  z: 'ź',
};

/** s03.phoneLabel -> "Phone Label", so a padded stand-in is still identifiable on screen. */
export function keyLabel(key: string): string {
  const leaf = key.split('.').pop() ?? key;

  return leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, first => first.toUpperCase());
}

/** targetLength counts the brackets, so a padded string never overshoots its budget. */
export function pseudoize(source: string, targetLength: number): string {
  const accented = source.replace(/[a-z]/gi, character => {
    const accent = ACCENTS[character.toLowerCase()];

    if (!accent) {
      return character;
    }

    return character === character.toLowerCase() ? accent : accent.toUpperCase();
  });

  // The two brackets and the space before the padding.
  const room = targetLength - accented.length - 3;

  return room > 0 ? `[${accented} ${'·'.repeat(room)}]` : `[${accented}]`;
}
