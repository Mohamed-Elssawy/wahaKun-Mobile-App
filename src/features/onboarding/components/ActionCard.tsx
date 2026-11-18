import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { ForwardIcon } from '@/i18n/icons';
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
        <Text variant="h4" color={selected ? 'primaryStrong' : 'textStrong'}>
          {title}
        </Text>
        <Text variant="body12" color={selected ? 'primaryStrong' : 'textMuted'}>
          {subtitle}
        </Text>
      </View>
      {showChevron ? <ForwardIcon size={24} color={colors.textPrimary} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[24],
    width: '100%',
    minHeight: 100,
    padding: spacing[24],
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radii[16],
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: colors.primaryStrong,
    backgroundColor: colors.primaryTint,
  },
  text: {
    flex: 1,
    gap: spacing[4],
  },
});
