import { useRef } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { FeedFilter } from '../types';

export type FeedFilterTabsProps = {
  filter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
};

// F-01 lists five, which is one more than fits at the widest Arabic label. Hence the scroll.
const TABS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'critical', label: 'حرج' },
  { key: 'nearby', label: 'قريب مني' },
  { key: 'inProgress', label: 'قيد الحل' },
  { key: 'resolved', label: 'تم الحل' },
];

const UNDERLINE_HEIGHT = 3;
const ROW_HEIGHT = 44;

/** The category row under the location selector, on the sand band below the green bar. */
export function FeedFilterTabs({ filter, onChange }: FeedFilterTabsProps) {
  const scrollRef = useRef<ScrollView>(null);
  const viewportWidth = useRef(0);

  return (
    // Fixed-height wrapper: a horizontal ScrollView defaults to flexGrow 1 and would otherwise
    // stretch down the screen, pushing the labels away from the header (the misplaced-text bug).
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
        onLayout={event => {
          viewportWidth.current = event.nativeEvent.layout.width;
        }}
        // RTL: when the tabs overflow, start scrolled to the right edge so الكل is visible first.
        onContentSizeChange={contentWidth => {
          if (contentWidth > viewportWidth.current) {
            scrollRef.current?.scrollToEnd({ animated: false });
          }
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.key === filter;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                variant={isActive ? 'label14Bold' : 'label14'}
                color={isActive ? 'primary' : 'textSecondary'}
                align="center"
                numberOfLines={1}
                style={styles.label}
              >
                {tab.label}
              </Text>

              {/* Always rendered so selecting a tab cannot change the row's height. */}
              <View style={[styles.underline, isActive && styles.underlineActive]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: ROW_HEIGHT,
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    // Fill the viewport so row-reverse pins the first tab (الكل) to the right edge.
    flexGrow: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: spacing[24],
    paddingHorizontal: spacing[24],
  },
  tab: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[8],
  },
  label: {
    // Arabic glyphs have tall ascenders/descenders; without this they get clipped on Android.
    includeFontPadding: false,
    textAlignVertical: 'center',
    writingDirection: 'rtl',
  },
  underline: {
    height: UNDERLINE_HEIGHT,
    alignSelf: 'stretch',
    borderTopLeftRadius: UNDERLINE_HEIGHT,
    borderTopRightRadius: UNDERLINE_HEIGHT,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.primary,
  },
});
