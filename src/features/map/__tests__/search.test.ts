import { filterIssues, normalizeArabic } from '../search';

import type { MapIssue } from '../types';

const issue = (id: string, title: string): MapIssue => ({
  id,
  title,
  latitude: 29.2,
  longitude: 25.5,
  status: 'Diagnosed',
  tier: 'medium',
  createdAt: '2026-08-09T13:01:13Z',
});

// The titles ReportService actually stores, taken off the wire.
const ISSUES = [
  issue('CAA8F1B2-0000-0000-0000-000000000001', 'تلف في أنبوب المياه'),
  issue('9B73EF0B-0000-0000-0000-000000000002', 'فيض في المياه'),
  issue('B5F5A1C3-0000-0000-0000-000000000003', 'انسداد في قناة الري'),
  issue('538C77D4-0000-0000-0000-000000000004', 'تسريب كبير في القناة الرئيسية'),
];

const titlesFor = (query: string) =>
  filterIssues(ISSUES, query).map(match => match.title);

describe('normalizeArabic', () => {
  it('folds every alef a keyboard can produce', () => {
    expect(normalizeArabic('أإآٱا')).toBe('ااااا');
  });

  it('drops harakat and tatweel', () => {
    expect(normalizeArabic('مِياه')).toBe('مياه');
    expect(normalizeArabic('ميـاه')).toBe('مياه');
  });

  it('reads both Arabic digit ranges as ASCII', () => {
    expect(normalizeArabic('٩٨٧٣')).toBe('9873');
    expect(normalizeArabic('۹۸۷۳')).toBe('9873');
  });
});

describe('filterIssues', () => {
  it('returns everything for an empty query', () => {
    expect(filterIssues(ISSUES, '   ')).toBe(ISSUES);
  });

  // The keyboard offers أنبوب as a correction for انبوب, so both spellings reach us.
  it('finds a word spelled without its hamza', () => {
    expect(titlesFor('انبوب')).toEqual(['تلف في أنبوب المياه']);
    expect(titlesFor('أنبوب')).toEqual(['تلف في أنبوب المياه']);
  });

  it('treats ta marbuta and ha as the same letter', () => {
    expect(titlesFor('قناه')).toHaveLength(2);
    expect(titlesFor('قناة')).toHaveLength(2);
  });

  it('ignores the definite article in either direction', () => {
    expect(titlesFor('القناة')).toHaveLength(2);
    expect(titlesFor('ري')).toHaveLength(2);
  });

  // Substring matching missed this: both words are there, just not next to each other.
  it('matches words in any order', () => {
    expect(titlesFor('تسريب القناة')).toEqual(['تسريب كبير في القناة الرئيسية']);
    expect(titlesFor('القناة تسريب')).toEqual(['تسريب كبير في القناة الرئيسية']);
  });

  it('finds a report by the reference its card prints', () => {
    expect(titlesFor('9B73')).toEqual(['فيض في المياه']);
    expect(titlesFor('#9b73')).toEqual(['فيض في المياه']);
  });

  it('still returns nothing when nothing matches', () => {
    expect(titlesFor('جرار')).toEqual([]);
  });
});
