import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import introOne from '@assets/images/intro-1.png';
import introTwo from '@assets/images/intro-2.png';
import introThree from '@assets/images/intro-3.png';

import { BrandLockup } from '../../components/BrandLockup';
import { SlideshowDots } from '../../components/SlideshowDots';
import { markIntroSeen } from '../../services/firstRunStore';

type Slide = { key: string; image: ImageSourcePropType; headline: string };

const SLIDES: Slide[] = [
  { key: 'report', image: introOne, headline: 'بلّغ عن مشكلتك بالصوت أو الصورة' },
  { key: 'expert', image: introTwo, headline: 'خبير معتمد يراجع ويحل المشكلة' },
  { key: 'track', image: introThree, headline: 'تابع حالة بلاغك حتى إصلاح المشكلة' },
];

/** S-01a to S-01c. Shown once, on the first launch, before the Welcome decision. */
export default function IntroSlideshowScreen({
  navigation,
}: ScreenProps<'IntroSlideshow'>) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const handleNext = async () => {
    if (!isLast) {
      // Clamped: one swipe can fire onMomentumScrollEnd twice, so index can lag reality.
      const next = Math.min(index + 1, SLIDES.length - 1);
      listRef.current?.scrollToIndex({ index: next, animated: true });
      return;
    }

    await markIntroSeen();
    // reset, not navigate: the intro is first-run only and must not sit on the back stack.
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={slide => slide.key}
        horizontal
        // inverted: slide one sits on the right and progress runs leftwards, which is the
        // direction the dots show and the way an Arabic reader turns a page.
        inverted
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
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
        <BrandLockup />

        <View style={styles.footer}>
          <Text variant="h3" color="primary" align="center">
            {SLIDES[index].headline}
          </Text>

          <View style={styles.controls}>
            <SlideshowDots count={SLIDES.length} activeIndex={index} />
            <Button
              label={isLast ? 'ابدأ استخدام التطبيق' : 'التالي'}
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
  footer: {
    gap: spacing[40],
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[32],
  },
  controls: {
    gap: spacing[24],
  },
});
