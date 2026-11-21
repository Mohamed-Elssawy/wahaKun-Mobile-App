import {
  expectLocaleFonts,
  expectNoArabicInInter,
  fontsIn,
  prune,
  renderBilingual,
  snapshotOf,
} from './harness';

import type { Locale } from './harness';

/** D5 archetypes 13-14 plus the three surfaces E7 added after: S-12, the pre-login control, the relaunch screen. */

const noop = () => {};
const other = (locale: Locale): Locale => (locale === 'ar' ? 'en' : 'ar');
const activeLocale = (): Locale => require('@/i18n').locale();
const text = (trees: Record<Locale, unknown>, locale: Locale) =>
  prune(trees[locale] as never).join('\n');

describe('S-13a · bottom sheet, standing in for S-13d (archetype 13)', () => {
  // S-13d (logout confirm) isn't built - logout is immediate - so S-13a's avatar sheet stands in.
  const sheetMock = () => {
    const React = require('react');
    const { View } = require('react-native');
    const Passthrough = ({ children }: { children?: unknown }) => children ?? null;
    const Modal = React.forwardRef((props: object, ref: unknown) =>
      React.createElement(View, { ...props, ref }),
    );

    return {
      __esModule: true,
      default: View,
      BottomSheetBackdrop: View,
      BottomSheetModal: Modal,
      BottomSheetModalProvider: Passthrough,
      BottomSheetView: View,
    };
  };
  const pictureMock = () => ({
    useProfilePicture: () => ({
      currentPicture: undefined,
      image: null,
      pickFromCamera: noop,
      pickFromGallery: noop,
      submit: noop,
      isSubmitting: false,
      errorMessage: undefined,
      isLoading: false,
      loadError: null,
      retry: noop,
    }),
  });
  const trees = renderBilingual(
    () => {
      const Screen = require('@/features/user/screens/EditProfilePictureScreen').default;
      const navigation = { navigate: noop, goBack: noop };

      return (
        <Screen
          navigation={navigation as never}
          route={{ key: 'k', name: 'EditProfilePicture' } as never}
        />
      );
    },
    {
      '@gorhom/bottom-sheet': sheetMock,
      '@/features/user/hooks/useProfilePicture': pictureMock,
    },
  );

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('X-05 · full-screen state (archetype 14)', () => {
  const trees = renderBilingual(() => {
    const {
      LocationPermissionDenied,
    } = require('@/features/reports/components/LocationPermissionDenied');

    return <LocationPermissionDenied onOpenSettings={noop} />;
  });

  it('renders each locale in its own faces', () => expectLocaleFonts(trees));

  it('sets its action at the button role: 16 in Arabic, 18 in English', () => {
    expect(text(trees, 'ar')).toMatch(/Text Cairo-SemiBold 16\/24 /);
    expect(text(trees, 'en')).toMatch(/Text Cairo-SemiBold 18\/30 /);
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('S-12 · the language dialog, confirm revealed', () => {
  const trees = renderBilingual(() => {
    const { LanguageDialog } = require('@/components/ui/LanguageDialog');
    const active = activeLocale();

    return (
      <LanguageDialog
        isVisible
        active={active}
        selected={other(active)}
        onSelect={noop}
        onConfirm={noop}
        onDismiss={noop}
      />
    );
  });

  it('names each language in its own script in both locales', () => {
    for (const locale of ['ar', 'en'] as const) {
      expect(text(trees, locale)).toContain('"العربية"');
      expect(text(trees, locale)).toContain('"English"');
    }
  });

  it('sets the Arabic note line in an Arabic face even when the UI is English', () => {
    expectNoArabicInInter(trees);
    // And the English line takes Inter in BOTH locales, which is the script-keyed half.
    expect([...fontsIn(trees.ar)]).toContain('Inter-Regular');
    expect([...fontsIn(trees.en)]).toContain('Inter-Regular');
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('the pre-login control', () => {
  const trees = renderBilingual(() => {
    const { LanguageControl } = require('@/components/ui/LanguageControl');

    return <LanguageControl onPress={noop} />;
  });

  it('names the language you would switch TO - the pinned, inverted pair', () => {
    expect(text(trees, 'ar')).toContain('"English"');
    expect(text(trees, 'en')).toContain('"العربية"');
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});

describe('the relaunch screen, written in the language being switched TO', () => {
  const trees = renderBilingual(() => {
    const { LanguageRelaunch } = require('@/components/ui/LanguageRelaunch');

    return (
      <LanguageRelaunch target={other(activeLocale())} failure={null} onRestart={noop} />
    );
  });

  it('is in the target language: English while Arabic runs, Arabic while English runs', () => {
    expect(text(trees, 'ar')).toContain('"Restart the app"');
    expect(text(trees, 'en')).toMatch(/[؀-ۿ]/);
    expectNoArabicInInter(trees);
  });

  it('sizes its button by the TARGET script, not the running locale', () => {
    // Arabic process, English label: the English size. English process, Arabic label: the Arabic.
    expect(text(trees, 'ar')).toMatch(/Text Cairo-SemiBold 18\/30 /);
    expect(text(trees, 'en')).toMatch(/Text Cairo-SemiBold 16\/24 /);
  });

  it('matches its snapshot in both locales', () =>
    expect(snapshotOf(trees)).toMatchSnapshot());
});
