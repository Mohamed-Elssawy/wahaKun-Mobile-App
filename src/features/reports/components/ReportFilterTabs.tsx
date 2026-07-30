import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { ReportFilter } from '../hooks/useMyReports';

export type ReportFilterTabsProps = {
  filter: ReportFilter;
  counts: Record<ReportFilter, number>;
  onChange: (filter: ReportFilter) => void;
};

// Only two tabs carry a count in the frame, and a count on all four reads as a dashboard.
const TABS: { key: ReportFilter; label: string; showCount: boolean }[] = [
  { key: 'all', label: 'الكل', showCount: false },
  { key: 'active', label: 'نشط', showCount: true },
  { key: 'resolved', label: 'تم الحل', showCount: true },
  { key: 'critical', label: 'حرج', showCount: false },
];

const UNDERLINE_HEIGHT = 2;

/** The filter row under the header. */
export function ReportFilterTabs({ filter, counts, onChange }: ReportFilterTabsProps) {
  return (
    <View style={styles.row}>
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
              color={isActive ? 'primary' : 'textMuted'}
            >
              {tab.showCount ? `${tab.label} (${counts[tab.key]})` : tab.label}
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
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  underline: {
    height: UNDERLINE_HEIGHT,
    // Narrower than the tab so the rule sits under the word, not the column.
    width: '70%',
    backgroundColor: colors.background,
  },
  underlineActive: {
    backgroundColor: colors.primary,
  },
});
