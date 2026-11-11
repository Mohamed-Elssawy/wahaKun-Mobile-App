import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

import { NotificationIcon } from './NotificationIcon';
import { formatNotificationTime } from '../time';

import type { NotificationItem } from '../types';

export type NotificationRowProps = {
  notification: NotificationItem;
  onPress: (notification: NotificationItem) => void;
};

const DOT_SIZE = 10;

/** Unread is a white card with a dot at the icon's top corner, as all three frames draw it. */
export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { type, title, createdAt, isRead } = notification;

  return (
    <TouchableOpacity
      style={[styles.row, !isRead && styles.unread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.text}>
        <Text variant="body14" color="textStrong" align="right">
          {title}
        </Text>
        <Text variant="label12" color="textMuted" align="right" style={styles.time}>
          {formatNotificationTime(createdAt)}
        </Text>
      </View>

      <View style={styles.iconWrap}>
        <NotificationIcon type={type} />
        {!isRead ? <View style={styles.dot} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Horizontal inset comes from the list, so read and unread rows land at the same x.
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[12],
    padding: spacing[16],
  },
  unread: {
    borderRadius: radii[16],
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  text: {
    flex: 1,
    gap: spacing[4],
  },
  // An LTR island per style: Western numerals and the ص/م period read left to right.
  time: {
    writingDirection: 'ltr',
  },
  iconWrap: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
});
