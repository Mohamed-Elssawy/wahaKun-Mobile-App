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

const UNDERLINE_HEIGHT = 2;

/** The filter row under the location selector. */
export function FeedFilterTabs({ filter, onChange }: FeedFilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
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
          >
            <Text
              variant={isActive ? 'label14Bold' : 'label14'}
              // N700, not textMuted: an unselected tab is still a control to read.
              color={isActive ? 'primary' : 'textSecondary'}
            >
              {tab.label}
            </Text>

            {/* Always rendered so selecting a tab cannot change the row's height. */}
            <View style={[styles.underline, isActive && styles.underlineActive]} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    // row-reverse: الكل is the first tab and sits at the right.
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: spacing[24],
    paddingHorizontal: spacing[24],
  },
  tab: {
    alignItems: 'center',
    gap: spacing[8],
  },
  underline: {
    height: UNDERLINE_HEIGHT,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.primary,
  },
});
