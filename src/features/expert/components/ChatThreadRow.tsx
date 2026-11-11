import { User } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { ChatThread } from '../types';

export type ChatThreadRowProps = {
  thread: ChatThread;
  onPress: (thread: ChatThread) => void;
};

const AVATAR_SIZE = 48;
const AVATAR_ICON = 22;
const UNREAD_DOT_SIZE = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Only the expert's own text carries read receipts; voice and image never show their content. */
function describePreview(message: ChatThread['lastMessage']): string {
  if (message.kind === 'voice') {
    return '🎤 رسالة صوتية';
  }
  if (message.kind === 'image') {
    return '🖼 صورة';
  }
  return message.fromExpert ? `✓✓ ${message.text ?? ''}` : (message.text ?? '');
}

/** Not notifications/time.ts: that formatter's yesterday carries a time this row must not draw. */
function formatThreadTimestamp(iso: string, now: Date): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (diffDays <= 0) {
    const hour24 = date.getHours();
    const period = hour24 < 12 ? 'ص' : 'م';
    const hour12 = hour24 % 12 || 12;
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${hour12}:${minute} ${period}`;
  }
  if (diffDays === 1) {
    return 'أمس';
  }
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/** E-09's row: identity and preview lead on the right, time and the unread dot trail left. */
export function ChatThreadRow({ thread, onPress }: ChatThreadRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(thread)}
      accessibilityRole="button"
      accessibilityLabel={thread.farmerName}
    >
      {thread.farmerAvatar ? (
        <Image source={{ uri: thread.farmerAvatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarEmpty]}>
          <User size={AVATAR_ICON} color={colors.textPrimary} />
        </View>
      )}

      <View style={styles.text}>
        <Text variant="label16Bold" align="right" numberOfLines={1}>
          {thread.farmerName}
        </Text>
        <Text variant="body14" color="textSecondary" align="right" numberOfLines={1}>
          {describePreview(thread.lastMessage)}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text variant="label12" color="textSecondary">
          {formatThreadTimestamp(thread.lastMessageAt, new Date())}
        </Text>
        {thread.isUnread ? <View style={styles.unreadDot} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surfaceMuted,
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: spacing[4],
  },
  meta: {
    alignItems: 'center',
    gap: spacing[4],
  },
  unreadDot: {
    width: UNREAD_DOT_SIZE,
    height: UNREAD_DOT_SIZE,
    borderRadius: UNREAD_DOT_SIZE / 2,
    backgroundColor: colors.primary,
  },
});
