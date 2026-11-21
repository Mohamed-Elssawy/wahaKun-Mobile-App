import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { isRTL, t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import introOne from '@assets/images/intro-1.png';
import introTwo from '@assets/images/intro-2.png';
import introThree from '@assets/images/intro-3.png';

import { BrandLockup } from '../../components/BrandLockup';
import { SlideshowDots } from '../../components/SlideshowDots';
import { markIntroSeen } from '../../services/firstRunStore';

/** headlineKey, not headline: this table is module scope and §16.2 resolves later. */
type Slide = { key: string; image: ImageSourcePropType; headlineKey: TranslationKey };

const SLIDES: Slide[] = [
  { key: 'report', image: introOne, headlineKey: 's01a.headline' },
  { key: 'expert', image: introTwo, headlineKey: 's01b.headline' },
  { key: 'track', image: introThree, headlineKey: 's01c.headline' },
];

/** S-01a to S-01c. Shown once, on the first launch, before the Welcome decision. */
export default function IntroSlideshowScreen({
  navigation,
}: ScreenProps<'IntroSlideshow'>) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  // W21: pages are read by physical position in the app's own direction; VirtualizedList's own RTL conversion uses the stale pre-boot I18nManager.isRTL (E7), so this uses isRTL() for this process instead.
  const positionOf = (page: number) => (isRTL() ? SLIDES.length - 1 - page : page);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const position = Math.round(event.nativeEvent.contentOffset.x / width);
    const page = positionOf(Math.min(Math.max(position, 0), SLIDES.length - 1));

    setIndex(page);
  };

  // Scrolls the raw ScrollView, not scrollToIndex, to skip the converted RTL frame; getScrollResponder() is typed as JSX (FlatList.js:391), hence the cast.
  const scrollToPage = (page: number) => {
    const scrollView =
      listRef.current?.getScrollResponder() as unknown as ScrollView | null;

    scrollView?.scrollTo({ x: positionOf(page) * width, animated: true });
  };

  const completeIntro = async () => {
    await markIntroSeen();
    // reset, not navigate: the intro is first-run only and must not sit on the back stack.
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleNext = async () => {
    if (!isLast) {
      // Clamped: one swipe can fire onMomentumScrollEnd twice, so index can lag reality.
      const next = Math.min(index + 1, SLIDES.length - 1);
      scrollToPage(next);
      return;
    }

    await completeIntro();
  };

  // Same completion as finishing the slideshow: seen once, never shown again, logout included.
  const handleSkip = completeIntro;

  const handleSelectSlide = (nextIndex: number) => {
    scrollToPage(nextIndex);
  };

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={slide => slide.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        // Android's clipping computed the wrong side in RTL and left the far page blank (measured, E9); safe to disable since all three pages mount anyway.
        removeClippedSubviews={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          // contain, not cover: Figma centres the artwork at full width over the ground.
          <Image
            source={item.image}
            style={[styles.illustration, { width }]}
            resizeMode="contain"
          />
        )}
      />

      <SafeAreaView
        style={styles.overlay}
        edges={['top', 'bottom']}
        pointerEvents="box-none"
      >
        {/* C17: one row, as the frames draw it - the lockup at the start, a quiet Skip opposite. */}
        <BrandLockup
          trailing={
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skip}
              accessibilityRole="button"
              accessibilityLabel={t('s01a.skip')}
            >
              <Text variant="label14" color="textSecondary">
                {t('s01a.skip')}
              </Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.footer}>
          {/* C18: dark, and at the frames' narrower measure, so it breaks where they break it. */}
          <Text variant="h3" color="textStrong" align="center" style={styles.headline}>
            {t(SLIDES[index].headlineKey)}
          </Text>

          <View style={styles.controls}>
            <SlideshowDots
              count={SLIDES.length}
              activeIndex={index}
              onSelect={handleSelectSlide}
            />
            <Button
              label={isLast ? t('s01c.cta') : t('common.next')}
              onPress={handleNext}
              showArrow
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // height, not flex: the list lays items out in a row, so flex would size the width.
  illustration: {
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'space-between',
  },
  // Padding is the touch target here, sized to match the frames' 52dp Skip inset.
  skip: {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
  },
  headline: {
    paddingHorizontal: spacing[16],
  },
  footer: {
    gap: spacing[40],
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[32],
  },
  controls: {
    gap: spacing[24],
  },
});
