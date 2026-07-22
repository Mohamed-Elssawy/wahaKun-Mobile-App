import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import type { ReactNode } from 'react';

export type ActionCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  selected?: boolean;
  /** Navigation cards show a chevron; selection cards do not. */
  showChevron?: boolean;
};

/**
 * Tappable card with a leading icon and a trailing chevron. Used for the
 * new-user / returning-user choice and for role selection.
 */
export function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
  selected = false,
  showChevron = true,
}: ActionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon}
      <View style={styles.text}>
        <Text variant="h4" align="right">
          {title}
        </Text>
        <Text variant="body12" color="textMuted" align="right">
          {subtitle}
        </Text>
      </View>
      {showChevron ? <ChevronLeft size={24} color={colors.textPrimary} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xl,
    width: '100%',
    minHeight: 100,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.textDisabled,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
});
