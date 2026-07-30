import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { colors, screenPadding, spacing } from '@/theme';

import type { ReactNode } from 'react';

export type ReportHeaderProps = {
  title: string;
  subtitle?: string;
  /** Omitted by My Issues, which is a tab and has nowhere to go back to. */
  onBack?: () => void;
  children?: ReactNode;
};

/** Back control sits left, matching WizardHeader, which Figma keeps despite the RTL. */
// In normal flow rather than overlaying, so the body just takes the space that is left.
export function ReportHeader({ title, subtitle, onBack, children }: ReportHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.xxl }]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <ChevronRight size={24} color={colors.textInverse} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.text}>
          <Text variant="h3" color="textInverse">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="label14" color="primaryTint">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {children}
    </View>
  );
}

const hitSlop = { top: 24, bottom: 24, left: 24, right: 24 };

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
