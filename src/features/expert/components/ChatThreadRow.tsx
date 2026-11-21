import { Image as ImageIcon, Mic, User } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { BiText, Text } from '@/components/ui';
import { formatTimeOfDay, yesterdayLabel } from '@/features/reports/relativeTime';
import { contentIsolate, t } from '@/i18n';
import { colors, spacing } from '@/theme';

import type { ChatThread } from '../types';
import type { LucideIcon } from 'lucide-react-native';

export type ChatThreadRowProps = {
  thread: ChatThread;
  onPress: (thread: ChatThread) => void;
};

const AVATAR_SIZE = 48;
const AVATAR_ICON = 22;
const PREVIEW_ICON = 16;
const UNREAD_DOT_SIZE = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whether the preview is author text (direction-sensitive) or chrome; C78's glyph is drawn by the component, never typed into the copy. */
type Preview = { isContent: boolean; text: string; icon?: LucideIcon };

/** Only the expert's own text carries read receipts; voice and image never show their content. */
function describePreview(message: ChatThread['lastMessage']): Preview {
  if (message.kind === 'voice') {
    return { isContent: false, text: t('chat.voiceMessage'), icon: Mic };
  }
  if (message.kind === 'image') {
    return { isContent: false, text: t('chat.photoMessage'), icon: ImageIcon };
  }

  const body = message.text ?? '';

  // The receipt is chrome wrapped around content, so the content takes an isolate of its own
  // rather than the whole line taking a direction the ticks do not belong to.
  return message.fromExpert
    ? { isContent: false, text: `✓✓ ${contentIsolate(body)}` }
    : { isContent: true, text: body };
}

/** Not notifications/time.ts: that formatter's yesterday carries a time this row must not draw. */
function formatThreadTimestamp(iso: string, now: Date): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (diffDays <= 0) {
    return formatTimeOfDay(date);
  }
  if (diffDays === 1) {
    return yesterdayLabel();
  }
  // Day/month/year, which British English orders the same way Arabic does, so one form serves.
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

/** E-09's row: identity and preview lead on the right, time and the unread dot trail left. */
export function ChatThreadRow({ thread, onPress }: ChatThreadRowProps) {
  const preview = describePreview(thread.lastMessage);
  const PreviewIcon = preview.icon;

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
        <BiText contentRole="title" variant="body16" numberOfLines={1}>
          {thread.farmerName}
        </BiText>
        {preview.isContent ? (
          <BiText
            contentRole="title"
            variant="body14"
            color="textSecondary"
            numberOfLines={1}
          >
            {preview.text}
          </BiText>
        ) : (
          <View style={styles.preview}>
            {PreviewIcon ? (
              <PreviewIcon size={PREVIEW_ICON} color={colors.textSecondary} />
            ) : null}
            <Text
              variant="body14"
              color="textSecondary"
              numberOfLines={1}
              style={styles.previewText}
            >
              {preview.text}
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    // C78: no rule between rows - separated by the avatar's rhythm alone, reading as one surface, not a ruled table.
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
  // flex-start, not stretch: a stretched box would carry an Arabic name to the row's far edge instead of hugging BiText's own direction.
  text: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  // The glyph leads the words and both sit on one baseline row, which mirrors with the layout.
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  // Shrinks so a long preview truncates at the row's edge instead of pushing the glyph out.
  previewText: {
    flexShrink: 1,
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
