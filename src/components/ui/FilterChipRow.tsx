import { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, screenPadding, shadows, spacing } from '@/theme';

import type { ReactNode } from 'react';

export type FilterChipRowProps = {
  /** FilterChips, in reading order: the first one lands at the right edge. */
  children: ReactNode;
};

/** The scrolling pill row under the tabs. It holds chips; it knows nothing about them. */
export function FilterChipRow({ children }: FilterChipRowProps) {
  const scroll = useRef<ScrollView>(null);

  return (
    // The row, then 16 of padding, then a hairline and the shadow it casts over the list.
    // Measured off the frame; without it the first card floats and the header reads unanchored.
    <View style={styles.container}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        // flexGrow 0: a horizontal ScrollView in a flex column stretches to fill the cross axis,
        // which left the chips floating at the bottom of a tall empty band.
        style={styles.scroll}
        contentContainerStyle={styles.row}
        // row-reverse puts the first chip at the right end of the content, but a horizontal
        // ScrollView still opens at the left, so the first chip scrolled off screen.
        // Unanimated: an animation here reads as the row sliding away as the screen appears.
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderCard,
    ...shadows.card,
    // Over the list, so the shadow falls on the cards rather than under them.
    zIndex: 1,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    // row-reverse plus a right gutter: the first chip belongs at the right edge.
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: screenPadding,
    paddingVertical: spacing[16],
  },
});
