import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing } from '@/theme';

import type { NotificationGroup } from '../time';

export type NotificationGroupHeaderProps = {
  group: NotificationGroup;
  title: string;
  /** Rendered only on اليوم's row, but the action marks every notification read, not this group's. */
  onMarkAllRead?: () => void;
};

const MARK_ALL_READ = 'تعليم الكل كمقروء';

export function NotificationGroupHeader({
  group,
  title,
  onMarkAllRead,
}: NotificationGroupHeaderProps) {
  return (
    <View style={styles.row}>
      {group === 'today' && onMarkAllRead ? (
        <TouchableOpacity onPress={onMarkAllRead} accessibilityRole="button">
          <Text variant="label14Bold" color="primary">
            {MARK_ALL_READ}
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}

      <Text variant="label14Bold" color="textSecondary" align="right">
        {title}
      </Text>
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
