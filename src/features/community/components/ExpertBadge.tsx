import { BadgeCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

const ICON_SIZE = 16;

/** Nothing earns it against the real backend yet: UserDetailsResponse carries no role. */
export function ExpertBadge() {
  return (
    <View
      style={styles.badge}
      accessibilityRole="text"
      accessibilityLabel={t('common.verifiedExpert')}
    >
      <BadgeCheck size={ICON_SIZE} color={colors.primaryStrong} />

      <Text variant="label14Bold" color="primaryStrong">
        {t('common.verifiedExpert')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
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
