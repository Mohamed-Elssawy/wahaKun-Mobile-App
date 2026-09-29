import { BadgeCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

const LABEL = 'خبير معتمد';

const ICON_SIZE = 16;

/**
 * The badge on an expert's comment. Nothing can earn it against the real backend yet:
 * UserDetailsResponse carries no role, so communityService sets isExpert to false.
 */
export function ExpertBadge() {
  return (
    <View style={styles.badge} accessibilityRole="text" accessibilityLabel={LABEL}>
      <BadgeCheck size={ICON_SIZE} color={colors.primaryStrong} />

      <Text variant="label14Bold" color="primaryStrong">
        {LABEL}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryStrong,
  },
});
