import { BadgeCheck, Send, User } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { ENABLE_COMMENT_POSTING } from '@/config/env';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { colors, radii, spacing } from '@/theme';

import type { Comment } from '../types';

export type CommentThreadProps = {
  comments: Comment[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

const AVATAR_SIZE = 32;
const AVATAR_ICON = 16;
const BADGE_ICON = 14;
const SEND_ICON = 20;
const SEND_SIZE = 40;

/** Posting needs the moderation service on :8000, which is not in the backend repo. */
const DISABLED_COMPOSER = 'إضافة التعليقات غير متاحة حاليًا';

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, comment.isExpert && styles.avatarExpert]}>
        <User
          size={AVATAR_ICON}
          color={comment.isExpert ? colors.primary : colors.textMuted}
        />
      </View>

      <View style={styles.rowBody}>
        <View style={[styles.bubble, comment.isExpert && styles.bubbleExpert]}>
          <View style={styles.bubbleHeader}>
            {comment.isExpert ? (
              <View style={styles.badge}>
                <Text variant="label12Bold" color="primary">
                  خبير معتمد
                </Text>
                <BadgeCheck size={BADGE_ICON} color={colors.primary} />
              </View>
            ) : null}

            <Text variant="label14Bold" align="right">
              {comment.authorName}
            </Text>
          </View>

          <Text variant="label14" align="right">
            {comment.text}
          </Text>
        </View>

        <Text variant="label12" color="textMuted" align="right">
          {formatRelativeTime(comment.createdAt)}
        </Text>
      </View>
    </View>
  );
}

/** F-04's comment section, including the composer. */
export function CommentThread({
  comments,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  hasError,
  onLoadMore,
  onRetry,
}: CommentThreadProps) {
  const renderBody = () => {
    if (isLoading) {
      return <ActivityIndicator color={colors.primary} style={styles.centred} />;
    }

    // A failed thread must not take the diagnosis with it, so this is inline, not a screen.
    if (hasError) {
      return (
        <TouchableOpacity
          style={styles.centred}
          onPress={onRetry}
          accessibilityRole="button"
        >
          <Text variant="label14" color="primary" align="center">
            تعذر تحميل التعليقات، اضغط لإعادة المحاولة
          </Text>
        </TouchableOpacity>
      );
    }

    if (comments.length === 0) {
      return (
        <Text variant="label14" color="textMuted" align="right" style={styles.centred}>
          لا توجد تعليقات بعد
        </Text>
      );
    }

    return (
      <>
        {comments.map(comment => (
          <CommentRow key={comment.id} comment={comment} />
        ))}

        {hasMore ? (
          <TouchableOpacity onPress={onLoadMore} accessibilityRole="button">
            {isLoadingMore ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text variant="label14Bold" color="primary" align="center">
                عرض تعليقات أقدم
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.section}>
      <Text variant="h4" align="right">
        {`التعليقات (${total})`}
      </Text>

      {renderBody()}

      <View style={styles.composer}>
        <View style={[styles.sendButton, styles.sendDisabled]}>
          <Send size={SEND_ICON} color={colors.textInverse} />
        </View>
        <View style={styles.input}>
          <Text variant="label14" color="textMuted" align="right">
            {ENABLE_COMMENT_POSTING ? 'أضف تعليقاً أو معلومة...' : DISABLED_COMPOSER}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[16],
  },
  centred: {
    paddingVertical: spacing[16],
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing[8],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarExpert: {
    backgroundColor: colors.primaryTint,
  },
  rowBody: {
    flex: 1,
    gap: spacing[4],
  },
  bubble: {
    padding: spacing[12],
    borderRadius: radii[12],
    backgroundColor: colors.surfaceMuted,
    gap: spacing[4],
  },
  bubbleExpert: {
    backgroundColor: colors.primaryTint,
  },
  bubbleHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  composer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
  },
  input: {
    flex: 1,
    justifyContent: 'center',
    minHeight: SEND_SIZE,
    paddingHorizontal: spacing[16],
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: SEND_SIZE,
    height: SEND_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sendDisabled: {
    backgroundColor: colors.disabled,
  },
});