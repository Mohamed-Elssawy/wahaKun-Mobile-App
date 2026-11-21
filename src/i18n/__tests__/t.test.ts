import type { ForcedLocale } from '@/config/env';

import { keyLabel, pseudoize } from '../pseudo';

type Catalogue = Record<string, string>;
type Vars = Record<string, string | number>;

/** `string`, not TranslationKey, deliberately: these cases mock the catalogue at runtime, not the compile-time ar.json. */
type MockT = (key: string, vars?: Vars) => string;
type MockTPlural = (stem: string, count: number, vars?: Vars) => string;

/** t() reads catalogues at module init and locale at call time, so a different case has to re-import both. */
function loadModule(forced: ForcedLocale | null, ar: Catalogue = {}, en: Catalogue = {}) {
  jest.resetModules();
  jest.doMock('@/config/env', () => ({ FORCE_LOCALE: forced }));
  jest.doMock('../ar.json', () => ar);
  jest.doMock('../en.json', () => en);

  return require('../t') as typeof import('../t');
}

function loadT(
  forced: ForcedLocale | null,
  ar: Catalogue = {},
  en: Catalogue = {},
): MockT {
  return loadModule(forced, ar, en).t as MockT;
}

function loadTPlural(
  forced: ForcedLocale | null,
  ar: Catalogue = {},
  en: Catalogue = {},
): MockTPlural {
  return loadModule(forced, ar, en).tPlural as MockTPlural;
}

/** The deck's own family, which commit 8 of E4 seeds and QueueBanner renders. */
const QUEUED_AR: Catalogue = {
  'reports.queuedCount.one': 'بلاغ واحد',
  'reports.queuedCount.two': 'بلاغان',
  'reports.queuedCount.few': '{count} بلاغات',
  'reports.queuedCount.many': '{count} بلاغًا',
};

const QUEUED_EN: Catalogue = {
  'reports.queuedCount.one': '1 report',
  'reports.queuedCount.many': '{count} reports',
};

describe('t with empty catalogues', () => {
  // The DoD: the layer ships before a single string moves, so this must not throw.
  it('answers the key itself and never undefined', () => {
    const t = loadT(null);

    expect(t('s03.title')).toBe('s03.title');
    expect(t('anything.at.all')).toBe('anything.at.all');
  });
});

describe('t lookup', () => {
  it('reads the active locale', () => {
    expect(
      loadT(
        'en',
        { 's03.cta': 'ارسال رمز التحقق' },
        { 's03.cta': 'Send verification code' },
      )('s03.cta'),
    ).toBe('Send verification code');
  });

  it('reads Arabic when Arabic is active', () => {
    expect(loadT(null, { 's03.cta': 'ارسال رمز التحقق' })('s03.cta')).toBe(
      'ارسال رمز التحقق',
    );
  });

  // A key on screen is how an untranslated string gets noticed before release.
  it('returns the key for a string with no English yet, in development', () => {
    expect(loadT('en', { 's03.cta': 'ارسال رمز التحقق' })('s03.cta')).toBe('s03.cta');
  });
});

describe('t interpolation', () => {
  it('substitutes {braces}', () => {
    const t = loadT(null, { 'f01.corroborations': '{count} أيضاً متأثرون' });

    expect(t('f01.corroborations', { count: 3 })).toBe('3 أيضاً متأثرون');
  });

  it('leaves an unknown placeholder verbatim rather than printing undefined', () => {
    const t = loadT('en', {}, { 'x.greet': 'Hello {name}, report {id}' });

    expect(t('x.greet', { name: 'Hoda' })).toBe('Hello Hoda, report {id}');
  });

  it('takes numbers as well as strings, since §16.7 never localises a digit', () => {
    const t = loadT('en', {}, { 'x.pct': '{value}% confidence' });

    expect(t('x.pct', { value: 91 })).toBe('91% confidence');
  });
});

describe('tPlural', () => {
  it('picks each of the four Arabic shapes from the catalogue', () => {
    const tPlural = loadTPlural(null, QUEUED_AR, QUEUED_EN);

    expect(tPlural('reports.queuedCount', 1)).toBe('بلاغ واحد');
    expect(tPlural('reports.queuedCount', 2)).toBe('بلاغان');
    expect(tPlural('reports.queuedCount', 5)).toBe('5 بلاغات');
    expect(tPlural('reports.queuedCount', 30)).toBe('30 بلاغًا');
  });

  // {count} is passed for free; the dual and singular carry the number in the word and ignore it.
  it('interpolates count without the caller naming it', () => {
    const tPlural = loadTPlural(null, QUEUED_AR, QUEUED_EN);

    expect(tPlural('reports.queuedCount', 7)).toContain('7');
    expect(tPlural('reports.queuedCount', 2)).not.toMatch(/\d/);
  });

  it('reaches only the two shapes English selects, so the dual is never addressed', () => {
    const tPlural = loadTPlural('en', QUEUED_AR, QUEUED_EN);

    expect(tPlural('reports.queuedCount', 1)).toBe('1 report');
    // The case the deck used to bake "2 reports" into: English selects many at exactly two.
    expect(tPlural('reports.queuedCount', 2)).toBe('2 reports');
    expect(tPlural('reports.queuedCount', 11)).toBe('11 reports');
  });

  it('lets a caller add vars of its own beside count', () => {
    const tPlural = loadTPlural('en', {}, { 'x.f.many': '{count} reports in {place}' });

    expect(tPlural('x.f', 3, { place: 'Dakhla' })).toBe('3 reports in Dakhla');
  });

  // No special case needed: locale() is 'en' under pseudo, and t() pseudoizes whatever comes back.
  it('pseudoizes through t, with no Arabic reaching the screen', () => {
    const tPlural = loadTPlural('pseudo', QUEUED_AR, QUEUED_EN);
    const out = tPlural('reports.queuedCount', 4);

    expect(out).toMatch(/^\[/);
    expect(out).not.toMatch(/[؀-ۿ]/);
    expect(out).toContain('4');
  });

  it('answers the address it composed when the family is not there, never undefined', () => {
    const tPlural = loadTPlural(null);

    expect(tPlural('reports.queuedCount', 1)).toBe('reports.queuedCount.one');
    expect(tPlural('reports.queuedCount', 5)).toBe('reports.queuedCount.few');
  });
});

describe('keyLabel', () => {
  it('turns a key leaf into words', () => {
    expect(keyLabel('s03.phoneLabel')).toBe('Phone Label');
    expect(keyLabel('f06.node4.label')).toBe('Label');
    expect(keyLabel('back')).toBe('Back');
  });
});

describe('pseudoize', () => {
  // b, f, m, q, v, x pass through unaccented: an accent for all 26 costs glyphs Inter may not ship.
  it('accents, pads and brackets to the target length', () => {
    const out = pseudoize('Phone Label', 20);

    expect(out).toBe('[Þĥóńé Łàbéł ······]');
    expect(out).toHaveLength(20);
  });

  it('brackets without padding when the source already fills the budget', () => {
    const out = pseudoize('Send verification code', 4);

    expect(out).toBe('[Śéńď véŕífíçàťíóń çóďé]');
  });

  // The whole reason the transform exists: a tofu box measures nothing about English width.
  it('emits no character outside Latin', () => {
    expect(pseudoize('Phone Label', 30)).toMatch(/^[ -ɏ·[\]]+$/);
  });
});

describe('t under the pseudo-locale', () => {
  it('stands the key leaf in when there is no English, sized from the Arabic', () => {
    const t = loadT('pseudo', { 'status.underReview': 'قيد المراجعة' });

    // Arabic is 12 chars, so budget is ceil(12 * 1.35) = 17; the key's leaf stands in for the missing English.
    expect(t('status.underReview')).toBe('[Úńďéŕ Ŕévíéŵ ··]');
  });

  it('pads the English string once one exists', () => {
    const t = loadT('pseudo', { 'x.k': 'كلمة' }, { 'x.k': 'Log in' });

    // ceil(6 * 1.3) = 8, which the brackets alone fill.
    expect(t('x.k')).toBe('[Łóğ íń]');
  });

  it('never exceeds the budget it was given', () => {
    expect(pseudoize('Phone Label', 20)).toHaveLength(20);
    expect(pseudoize('Phone Label', 14).length).toBeLessThanOrEqual(14);
  });

  it('interpolates before padding, so a long value still shows as clipping', () => {
    const t = loadT('pseudo', {}, { 'x.k': 'Report {id}' });

    expect(t('x.k', { id: 1043 })).toContain('1043');
  });

  it('never emits Arabic, even for a key only Arabic has', () => {
    const t = loadT('pseudo', { 'x.only': 'قيد المراجعة' });

    expect(t('x.only')).not.toMatch(/[؀-ۿ]/);
  });
});
