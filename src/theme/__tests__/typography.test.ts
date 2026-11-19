import type { ForcedLocale } from '@/config/env';

/** typography.ts resolves at module init, so each locale needs its own fresh import. */
function loadTypography(forced: ForcedLocale | null): typeof import('../typography') {
  jest.resetModules();
  jest.doMock('@/config/env', () => ({ FORCE_LOCALE: forced }));

  return require('../typography');
}

describe('Arabic typography', () => {
  // E1's definition of done: Arabic is byte-for-byte what shipped before, so these are spelled out rather than derived.
  it('is unchanged from the single-locale theme', () => {
    const { fonts, textStyles } = loadTypography(null);

    expect(fonts).toEqual({
      heading: 'Cairo-SemiBold',
      regular: 'NotoSansArabic-Regular',
      medium: 'NotoSansArabic-Medium',
      semibold: 'NotoSansArabic-SemiBold',
      latin: 'Lora-Regular',
      latinStrong: 'Lora-SemiBold',
    });

    // fonts.heading, not the raw string - CONVENTIONS forbids a literal fontFamily outright.
    expect(textStyles.h1).toEqual({
      fontFamily: fonts.heading,
      fontSize: 40,
      lineHeight: 50,
    });
    expect(textStyles.h2).toEqual({
      fontFamily: fonts.heading,
      fontSize: 32,
      lineHeight: 40,
    });
    expect(textStyles.h3).toEqual({
      fontFamily: fonts.heading,
      fontSize: 24,
      lineHeight: 40,
    });
    expect(textStyles.h4).toEqual({
      fontFamily: fonts.heading,
      fontSize: 18,
      lineHeight: 30,
    });
    expect(textStyles.body12.lineHeight).toBe(21);
    expect(textStyles.body14.lineHeight).toBe(24.5);
    expect(textStyles.body16.lineHeight).toBe(28);
  });
});

describe('English typography', () => {
  it('swaps the family for the Latin body and label cuts only', () => {
    const { fonts } = loadTypography('en');

    expect(fonts).toEqual({
      heading: 'Cairo-SemiBold',
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      latin: 'Lora-Regular',
      latinStrong: 'Lora-SemiBold',
    });
  });

  // §16.6: family and line height change with locale, no VARIANT's size ever does - E8's role layer sits above this rule, unchanged.
  it('changes no variant size anywhere', () => {
    const arabic = loadTypography(null).textStyles;
    const english = loadTypography('en').textStyles;

    const sizes = (styles: typeof arabic) =>
      Object.fromEntries(
        Object.entries(styles).map(([variant, style]) => [variant, style.fontSize]),
      );

    expect(sizes(english)).toEqual(sizes(arabic));
  });

  // §16.6: leading changes only where family changes; body is the only family that does, so these three are the whole of it.
  it('tightens the three body line heights and nothing else', () => {
    const { textStyles } = loadTypography('en');

    expect(textStyles.body12.lineHeight).toBe(18);
    expect(textStyles.body14.lineHeight).toBe(21);
    expect(textStyles.body16.lineHeight).toBe(24);
  });

  // Family stops a regression to Inter; leading stops the struck scale returning with it.
  it('resolves every heading variant to the same family and leading as Arabic', () => {
    const arabic = loadTypography(null).textStyles;
    const english = loadTypography('en').textStyles;

    for (const variant of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
      expect(english[variant].fontFamily).toBe(arabic[variant].fontFamily);
      expect(english[variant].lineHeight).toBe(arabic[variant].lineHeight);
    }
  });

  it('leaves every label variant and h5/h6 at the ratio both locales share', () => {
    const { textStyles } = loadTypography('en');

    expect(textStyles.h5.lineHeight).toBe(24);
    expect(textStyles.h6.lineHeight).toBe(17.5);
    expect(textStyles.label12.lineHeight).toBe(18);
    expect(textStyles.label14.lineHeight).toBe(21);
    expect(textStyles.label16.lineHeight).toBe(24);
    expect(textStyles.label20.lineHeight).toBe(30);
  });
});

describe('the pseudo-locale', () => {
  // Renders accented Latin, so it needs Latin metrics; Cairo carries every glyph pseudo.ts emits.
  it('takes the English faces and line heights', () => {
    const { fonts, textStyles } = loadTypography('pseudo');

    expect(fonts.heading).toBe('Cairo-SemiBold');
    expect(textStyles.body14.lineHeight).toBe(21);
  });
});

describe('the role layer', () => {
  // §16.6 as amended in E8. A role selects a variant; it never changes one.
  it('points the button label and the tracker node title one heading up in English', () => {
    expect(loadTypography(null).roleVariants).toMatchObject({
      buttonLabel: 'h5',
      timelineNode: 'h5',
    });
    expect(loadTypography('en').roleVariants).toMatchObject({
      buttonLabel: 'h4',
      timelineNode: 'h4',
    });
  });

  // E10: every other role measured equal in both locales; naming one in both tables is a type error (TS2322), not a silent shadow.
  it('gives a ghost button label the same 14 link in both locales', () => {
    expect(loadTypography(null).roleVariants.ghostLabel).toBe('body14');
    expect(loadTypography('en').roleVariants.ghostLabel).toBe('body14');
  });

  it('heads a group of rows in Cairo 16 in both locales', () => {
    expect(loadTypography(null).roleVariants.sectionHeader).toBe('h5');
    expect(loadTypography('en').roleVariants.sectionHeader).toBe('h5');
  });

  it('names exactly the roles that diverge, so a third is a decision and not a drift', () => {
    // Widened to strings - the literal types alone would let the compiler "prove" every role diverges.
    const table: Record<'ar' | 'en', Record<string, string>> = loadTypography(
      null,
    ).scriptRoleVariants;
    const diverging = Object.keys(table.ar).filter(
      role => table.ar[role] !== table.en[role],
    );

    expect(diverging.sort()).toEqual(['buttonLabel', 'timelineNode']);
  });

  it('only ever points at a variant both locales already share at the same size', () => {
    const arabic = loadTypography(null);
    const english = loadTypography('en');

    for (const variant of Object.values(english.roleVariants)) {
      expect(english.textStyles[variant].fontSize).toBe(
        arabic.textStyles[variant].fontSize,
      );
    }
  });

  // Keyed by script, same shape in both locales - lets S-12's relaunch set an Arabic label while the process runs English.
  it('keys scriptRoleVariants by script, identically whichever locale booted', () => {
    expect(loadTypography('en').scriptRoleVariants).toEqual(
      loadTypography(null).scriptRoleVariants,
    );
  });

  it('gives the pseudo-locale the English roles, since it measures English', () => {
    expect(loadTypography('pseudo').roleVariants.buttonLabel).toBe('h4');
  });
});
