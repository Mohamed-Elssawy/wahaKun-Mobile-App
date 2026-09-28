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
            <Text
              variant={isActive ? 'label16Bold' : 'label16'}
              color={isActive ? 'primary' : 'textMuted'}
            >
              {entry.label}
            </Text>

            {/* Always rendered so selecting a tab cannot change the row's height. */}
            <View style={[styles.underline, isActive && styles.underlineActive]} />
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
    // Equal thirds rather than intrinsic width, which is what keeps the underline centred
    // under labels of very different lengths.
    flex: 1,
    alignItems: 'center',
    gap: spacing[8],
    minHeight: 44,
  },
  underline: {
    height: UNDERLINE_HEIGHT,
    // Narrower than the tab, so it underlines the word rather than the whole third.
    width: '60%',
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.primary,
  },
});
