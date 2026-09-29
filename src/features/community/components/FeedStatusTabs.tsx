import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, screenPadding, spacing } from '@/theme';

import type { FeedTab } from '../types';

export type FeedStatusTabsProps = {
  tab: FeedTab;
  onChange: (tab: FeedTab) => void;
};

// Three, and all three fit at the widest Arabic label, so this row does not scroll. The
// severity chips underneath are the ones that do.
const TABS: { key: FeedTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشطة' },
  { key: 'resolved', label: 'تم الحل' },
];

const UNDERLINE_HEIGHT = 2;

/** The status segment above the severity chips. Single-select. */
export function FeedStatusTabs({ tab, onChange }: FeedStatusTabsProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map(entry => {
        const isActive = entry.key === tab;

        return (
          <TouchableOpacity
            key={entry.key}
            style={styles.tab}
            onPress={() => onChange(entry.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {/* Wraps the label so the underline can stretch to the word rather than to the
                third of the row the tab occupies, which is what the frame draws. */}
            <View style={styles.inner}>
              {/* h5 both ways: the frame changes the colour between states, not the type. */}
              <Text variant="h5" color={isActive ? 'primary' : 'textMuted'}>
                {entry.label}
              </Text>

              {/* Always rendered so selecting a tab cannot change the row's height. */}
              <View style={[styles.underline, isActive && styles.underlineActive]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    // row-reverse: الكل is the first tab and belongs at the right.
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[16],
  },
  tab: {
    // Equal thirds rather than intrinsic width, which is what spreads them across the row.
    flex: 1,
    alignItems: 'center',
    minHeight: 44,
  },
  inner: {
    alignItems: 'center',
    gap: spacing[8],
    // The underline overhangs the word by this much on each side in the frame.
    paddingHorizontal: spacing[4],
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
