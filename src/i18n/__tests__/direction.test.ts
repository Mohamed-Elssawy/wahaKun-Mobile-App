import { contentIsolate, detectDirection, directionFor, ltrIsolate } from '../index';

// Covers the cases a containment test or a majority rule gets wrong - both are plausible shortcuts for this function.
describe('detectDirection', () => {
  it('reads a block by its first strong character, not by its contents', () => {
    expect(detectDirection('تسريب في القناة')).toBe('rtl');
    expect(detectDirection('Water is leaking')).toBe('ltr');
  });

  it('ignores leading neutrals, which is what makes a quoted block work', () => {
    expect(detectDirection('”تسريب في القناة“')).toBe('rtl');
    expect(detectDirection('(Eastern side) the water is rising')).toBe('ltr');
    expect(detectDirection('  \n  تسريب')).toBe('rtl');
  });

  it('follows the first script even when the other one supplies most of the characters', () => {
    // A ratio or a count would call this English; it is an Arabic sentence quoting a part number.
    expect(detectDirection('المضخة موديل Grundfos SP 5A-9 بتفصل لوحدها')).toBe('rtl');
    expect(detectDirection('Replaced the مصفاة yesterday')).toBe('ltr');
  });

  it('has no direction for content that carries no strong character', () => {
    expect(detectDirection('')).toBeNull();
    expect(detectDirection('   ')).toBeNull();
    expect(detectDirection('1043')).toBeNull();
    expect(detectDirection('#1043 — 24-48 (91%)')).toBeNull();
    expect(detectDirection('؟،.')).toBeNull();
  });

  // None of these is a strong character, though the Figma plugin's hasArabic would call them Arabic.
  it('does not mistake Arabic digits or Arabic punctuation for Arabic letters', () => {
    expect(detectDirection('٢٠٢٦')).toBeNull();
    expect(detectDirection('، hello')).toBe('ltr');
    expect(detectDirection('؟ yes')).toBe('ltr');
  });

  it('still reads a presentation form and a supplement letter as Arabic', () => {
    expect(detectDirection('ﻵ')).toBe('rtl');
    expect(detectDirection('ݐ')).toBe('rtl');
  });
});

describe('the isolates', () => {
  it('wraps with FSI and PDI, which is what both callers depend on', () => {
    expect(ltrIsolate('+20')).toBe('⁨+20⁩');
    expect(contentIsolate('سبب التغيير')).toBe('⁨سبب التغيير⁩');
  });

  it('still derives the UI direction from the locale and not from any string', () => {
    expect(directionFor('ar')).toBe('rtl');
    expect(directionFor('en')).toBe('ltr');
  });
});
