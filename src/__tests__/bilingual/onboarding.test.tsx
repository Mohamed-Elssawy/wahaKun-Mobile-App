import { expectLocaleFonts, prune, renderBilingual, snapshotOf } from './harness';

/** D5 archetypes 1-4; every subject is required inside `build`, never imported at the top (see harness.ts). */

const navigation = () =>
  ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
  }) as never;

describe('S-05.1 · green header and progress (archetype 1)', () => {
  const trees = renderBilingual(() => {
    const FullNameScreen =
      require('@/features/onboarding/screens/FullNameScreen').default;
    const {
      RegistrationProvider,
    } = require('@/features/onboarding/context/RegistrationContext');

    return (
      <RegistrationProvider>
        <FullNameScreen
          navigation={navigation()}
          route={{ key: 'k', name: 'FullName' } as never}
        />
      </RegistrationProvider>
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('keeps the step counter in reading order, with a Latin digit in both', () => {
    const lines = (locale: 'ar' | 'en') => prune(trees[locale]).join('\n');

    expect(lines('ar')).toMatch(/الخطوة 1 من 5/);
    expect(lines('en')).toMatch(/Step 1 of 5/);
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('S-03 · plain canvas, +20 island and the pre-login control (archetype 2)', () => {
  const trees = renderBilingual(() => {
    const PhoneLoginScreen = require('@/features/auth/screens/PhoneLoginScreen').default;

    return (
      <PhoneLoginScreen
        navigation={navigation()}
        route={{ key: 'k', name: 'PhoneLogin' } as never}
      />
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('keeps the + 20 prefix left-to-right in both locales', () => {
    for (const locale of ['ar', 'en'] as const) {
      const text = prune(trees[locale]).join('\n');

      // SPEC §8 S-03 writes "+ 20" as a label now, still the LTR island §6.7 wants.
      expect(text).toContain('writingDirection:"ltr" "+ 20"');
    }
  });

  it('names the language you would switch TO on the control, which is the pinned inversion', () => {
    expect(prune(trees.ar).join('\n')).toContain('"English"');
    expect(prune(trees.en).join('\n')).toContain('"العربية"');
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('S-02 · entry fork cards (archetype 3)', () => {
  const trees = renderBilingual(() => {
    const WelcomeScreen = require('@/features/onboarding/screens/WelcomeScreen').default;

    return (
      <WelcomeScreen
        navigation={navigation()}
        route={{ key: 'k', name: 'Welcome' } as never}
      />
    );
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('keeps the wordmark identical in both locales, since it is a brand asset', () => {
    for (const locale of ['ar', 'en'] as const) {
      const text = prune(trees[locale]).join('\n');

      expect(text).toContain('"واحة كُن"');
      expect(text).toContain('"Waha KUN"');
    }
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('S-04 · the OTP row (archetype 4)', () => {
  const trees = renderBilingual(() => {
    const { OtpInput } = require('@/components/ui/OtpInput');

    return <OtpInput value="538" onChange={() => {}} />;
  });

  it('fills left to right in BOTH locales - an island in Arabic, natural in English, never flipped twice', () => {
    // The row is identical in both locales; only the cells' accessibility labels translate.
    const [arRow] = prune(trees.ar);
    const [enRow] = prune(trees.en);

    expect(arRow).toBe(enRow);
    expect(arRow).toMatch(/flexDirection:"row" direction:"ltr"/);
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});
