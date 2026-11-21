import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { spacing } from '@/theme';

import type { NotificationGroup } from '../time';

export type NotificationGroupHeaderProps = {
  group: NotificationGroup;
  title: string;
  /** Rendered only on اليوم's row, but the action marks every notification read, not this group's. */
  onMarkAllRead?: () => void;
};

export function NotificationGroupHeader({
  group,
  title,
  onMarkAllRead,
}: NotificationGroupHeaderProps) {
  return (
    <View style={styles.row}>
      <Text variant="label14Bold" color="textSecondary">
        {title}
      </Text>

      {group === 'today' && onMarkAllRead ? (
        <TouchableOpacity onPress={onMarkAllRead} accessibilityRole="button">
          <Text variant="label14Bold" color="primary">
            {t('s06.markAllRead')}
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
  },
});
