import { User } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { BiText, Text } from '@/components/ui';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { colors, radii, spacing } from '@/theme';

import { ExpertBadge } from './ExpertBadge';
import { avatarTintFor } from '../avatarTint';

import type { Comment } from '../types';

export type CommentBubbleProps = {
  comment: Comment;
};

const AVATAR_SIZE = 36;
const AVATAR_ICON = 18;

/** One comment: tinted avatar trailing, bubble beside it, timestamp under the bubble. */
export function CommentBubble({ comment }: CommentBubbleProps) {
  const tint = avatarTintFor(comment.authorId, comment.isExpert);

  return (
    <View style={styles.row}>
      {comment.authorPicture ? (
        <Image source={{ uri: comment.authorPicture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors[tint] }]}>
          <User size={AVATAR_ICON} color={colors.textPrimary} />
        </View>
      )}

      <View style={styles.body}>
        <View style={[styles.bubble, comment.isExpert && styles.bubbleExpert]}>
          <View style={styles.header}>
            {/* Name leads at the right, badge takes the opposite edge, as the frame draws it. */}
            <BiText contentRole="title" variant="label16Bold">
              {comment.authorName}
            </BiText>

            {comment.isExpert ? <ExpertBadge /> : null}
          </View>

          <BiText
            contentRole="body"
            variant="body14"
            color={comment.isExpert ? 'textStrong' : 'textSecondary'}
          >
            {comment.text}
          </BiText>
        </View>

        {/* Outside the bubble and on the leading edge, which is where the frame puts it. */}
        <Text variant="label12" color="textMuted" style={styles.timestamp}>
          {formatRelativeTime(comment.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
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
  // The badge sits opposite the name rather than under it, so a long name still wraps first.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  timestamp: {
    alignSelf: 'flex-end',
  },
});
