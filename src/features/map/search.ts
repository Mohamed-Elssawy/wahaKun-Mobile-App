import { formatReportReference } from '@/features/reports/format';

import type { MapIssue } from './types';

/** Spellings folded to one form: Arabic search fails on spelling far more often than on meaning. */
const LETTER_FOLDS: Record<string, string> = {
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ٱ: 'ا',
  ة: 'ه',
  ى: 'ي',
  ؤ: 'ء',
  ئ: 'ء',
};

/** Harakat, the dagger alef and tatweel: decoration that carries no meaning to a search. */
const MARKS = /[ً-ْٰـ]/g;

/** Arabic-Indic and its extended range. The reference `#9B73` is printed in ASCII. */
const DIGIT_BASES = [0x0660, 0x06f0];

/** Stripped from a term so قناة finds القناة and القناة finds قناة. */
const ARTICLE = /^ال(?=.{2})/;

function foldDigit(char: string): string {
  const code = char.codePointAt(0) ?? 0;
  const base = DIGIT_BASES.find(start => code >= start && code <= start + 9);
  return base === undefined ? char : String(code - base);
}

/** One spelling of a word, whichever spelling reached us. */
export function normalizeArabic(text: string): string {
  return [...text.replace(MARKS, '').toLowerCase()]
    .map(char => LETTER_FOLDS[char] ?? foldDigit(char))
    .join('');
}

/** Every word must appear somewhere, so word order and words in between stop mattering. */
function toTerms(query: string): string[] {
  return normalizeArabic(query)
    .split(/\s+/)
    .filter(Boolean)
    .map(term => term.replace(ARTICLE, ''));
}

/** Title and reference both: the card prints `#9B73`, so the farmer can search for it. */
function haystack(issue: MapIssue): string {
  return normalizeArabic(`${issue.title} ${formatReportReference(issue.id)}`);
}

/** F-05's search box. Returns the list untouched when there is nothing to search for. */
export function filterIssues(issues: MapIssue[], query: string): MapIssue[] {
  const terms = toTerms(query);
  if (terms.length === 0) {
    return issues;
  }

  return issues.filter(issue => {
    const text = haystack(issue);
    return terms.every(term => text.includes(term));
  });
}
