import { ChevronLeft, Plus } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

export type ReportCtaCardProps = {
  onPress: () => void;
};

const DISC_SIZE = 56;
const PLUS_SIZE = 28;
const CHEVRON_SIZE = 24;

const TITLE = 'الإبلاغ عن مشكلة';
const SUBTITLE = 'صوّر المشكلة أو سجّلها صوتياً — ودعنا نتابعها معك';

/** Sits above My Issues in every frame, empty ones included, so filing is always one tap. */
export function ReportCtaCard({ onPress }: ReportCtaCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={TITLE}
      accessibilityHint={SUBTITLE}
    >
      <View style={styles.disc}>
        <Plus size={PLUS_SIZE} color={colors.primary} />
      </View>

      <View style={styles.text}>
        <Text variant="h4" color="textInverse" align="right">
          {TITLE}
        </Text>
        <Text variant="label12" color="primaryTint" align="right">
          {SUBTITLE}
        </Text>
      </View>

      <ChevronLeft size={CHEVRON_SIZE} color={colors.textInverse} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[16],
    borderRadius: radii[16],
    backgroundColor: colors.primary,
    ...shadows.card,
  },
  disc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Takes the leftover width so the chevron stays pinned to the far edge.
  text: {
    flex: 1,
    gap: spacing[2],
  },
});
