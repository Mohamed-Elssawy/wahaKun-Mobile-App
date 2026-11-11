import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import { CommentBubble } from './CommentBubble';

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

const EMPTY = 'لا توجد تعليقات بعد';
const LOAD_MORE = 'عرض تعليقات أقدم';
const RETRY = 'تعذر تحميل التعليقات، اضغط لإعادة المحاولة';

/** F-04's thread. The composer is not here: the frame pins it to the screen, not the list. */
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
            {RETRY}
          </Text>
        </TouchableOpacity>
      );
    }

    if (comments.length === 0) {
      return (
        <Text variant="label14" color="textMuted" align="right" style={styles.centred}>
          {EMPTY}
        </Text>
      );
    }

    return (
      <>
        {comments.map(comment => (
          <CommentBubble key={comment.id} comment={comment} />
        ))}

        {hasMore ? (
          <TouchableOpacity
            style={styles.more}
            onPress={onLoadMore}
            accessibilityRole="button"
          >
            {isLoadingMore ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text variant="label14Bold" color="primary" align="center">
                {LOAD_MORE}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.section}>
      {/* The count is the Redis total, not this page's length, so it is right on page one. */}
      <Text variant="h4" align="right" color="textStrong">
        {`التعليقات (${total})`}
      </Text>

      {renderBody()}
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
  more: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
