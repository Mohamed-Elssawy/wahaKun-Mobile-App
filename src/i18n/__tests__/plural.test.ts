import { pluralShape, selectPlural } from '../plural';

import type { PluralForms } from '../plural';

// The shapes relativeTime.ts already encodes, as a table rather than a chain of ifs.
const ARABIC_SHAPES: ReadonlyArray<[number, string]> = [
  [0, 'few'],
  [1, 'one'],
  [2, 'two'],
  [3, 'few'],
  [10, 'few'],
  [11, 'many'],
  [100, 'many'],
];

describe('pluralShape', () => {
  it.each(ARABIC_SHAPES)('counts %i in the %s shape in Arabic', (count, shape) => {
    expect(pluralShape(count, 'ar')).toBe(shape);
  });

  it.each([0, 2, 3, 10, 11, 100])('counts %i as many in English', count => {
    expect(pluralShape(count, 'en')).toBe('many');
  });

  it('keeps one for exactly one in English', () => {
    expect(pluralShape(1, 'en')).toBe('one');
  });
});

describe('selectPlural', () => {
  const arabic: PluralForms = { one: 'يوم', two: 'يومين', few: 'أيام', many: 'يوماً' };
  const english: PluralForms = { one: 'day', many: 'days' };

  it('picks each of the four Arabic shapes', () => {
    expect(selectPlural(arabic, 1, 'ar')).toBe('يوم');
    expect(selectPlural(arabic, 2, 'ar')).toBe('يومين');
    expect(selectPlural(arabic, 5, 'ar')).toBe('أيام');
    expect(selectPlural(arabic, 30, 'ar')).toBe('يوماً');
  });

  // The reason two and few are optional: an English table declares two fields, not four.
  it('falls back to many for a shape an English table does not declare', () => {
    expect(selectPlural(english, 1, 'en')).toBe('day');
    expect(selectPlural(english, 7, 'en')).toBe('days');
  });

  // An Arabic table read in English must still answer, in case a caller gets the locale wrong.
  it('reads an Arabic table in English without reaching the dual', () => {
    expect(selectPlural(arabic, 2, 'en')).toBe('يوماً');
  });
});
