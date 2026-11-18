import { Dimensions, FlatList } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { setLocale, t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';

import IntroSlideshowScreen from '../screens/IntroSlideshowScreen';

import type { ReactTestRenderer } from 'react-test-renderer';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderIntro() {
  let tree!: ReactTestRenderer;
  const props = {
    navigation: { reset: jest.fn() },
    route: { key: 'intro', name: 'IntroSlideshow' },
  };

  act(() => {
    tree = create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <IntroSlideshowScreen {...(props as unknown as ScreenProps<'IntroSlideshow'>)} />
      </SafeAreaProvider>,
    );
  });

  return tree;
}

const strings = (tree: ReactTestRenderer) =>
  tree.root
    .findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children as string);

/** Settle the list at a RAW physical offset, as the native scroll view reports it. */
function settleAt(tree: ReactTestRenderer, position: number) {
  const width = Dimensions.get('window').width;

  act(() => {
    tree.root.findByType(FlatList).props.onMomentumScrollEnd({
      nativeEvent: { contentOffset: { x: position * width, y: 0 } },
    });
  });
}

// W21: pins that a page is read from its physical position in the app's own direction, since RTL puts page one on the right.
describe("S-01a-c: the page is found from its physical position, in the app's direction", () => {
  afterEach(() => setLocale('ar'));

  it('reads the leftmost position as page three in Arabic, and the rightmost as page one', () => {
    setLocale('ar');
    const tree = renderIntro();

    settleAt(tree, 0);
    expect(strings(tree)).toEqual(
      expect.arrayContaining([t('s01c.headline'), t('s01c.cta')]),
    );

    settleAt(tree, 2);
    expect(strings(tree)).toContain(t('s01a.headline'));
  });

  it('reads the leftmost position as page one in English, and the rightmost as page three', () => {
    setLocale('en');
    const tree = renderIntro();

    settleAt(tree, 0);
    expect(strings(tree)).toContain(t('s01a.headline'));

    settleAt(tree, 2);
    expect(strings(tree)).toEqual(
      expect.arrayContaining([t('s01c.headline'), t('s01c.cta')]),
    );
  });

  it('keeps the far page mounted, so Android cannot blank it in the Arabic UI', () => {
    const list = renderIntro().root.findByType(FlatList);

    expect(list.props.removeClippedSubviews).toBe(false);
  });
});
