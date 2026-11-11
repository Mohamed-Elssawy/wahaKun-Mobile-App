import { Send } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Text } from '@/components/ui';
import { colors, maxFontScale, radii, screenPadding, spacing, textStyles } from '@/theme';

export type CommentComposerProps = {
  /** False renders the bar disabled and says why, rather than hiding it and losing the frame. */
  canPost: boolean;
  isPosting: boolean;
  /** Resolves true when the comment was accepted, which is when the field clears. */
  onSubmit: (text: string) => Promise<boolean>;
  errorMessage?: string;
};

const PLACEHOLDER = 'أضف تعليقاً أو معلومة...';

/** Posting needs the moderation service on :8000, which is not in the backend repo. */
const DISABLED = 'إضافة التعليقات غير متاحة حاليًا';

const SEND_ICON = 20;
const SEND_SIZE = 44;
const MAX_LINES = 4;

/** The bar pinned under F-04's thread. Its own component so the screen stays layout. */
export function CommentComposer({
  canPost,
  isPosting,
  onSubmit,
  errorMessage,
}: CommentComposerProps) {
  const [text, setText] = useState('');

  const canSend = canPost && !isPosting && text.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) {
      return;
    }
    // Cleared only on success, so a rejected comment is still there to edit and resend.
    if (await onSubmit(text)) {
      setText('');
    }
  };

  return (
    <View style={styles.bar}>
      {errorMessage ? (
        <Text variant="label12" color="errorText" align="right">
          {errorMessage}
        </Text>
      ) : null}

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.send, !canSend && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="إرسال التعليق"
          accessibilityState={{ disabled: !canSend }}
        >
          {isPosting ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Send size={SEND_ICON} color={colors.textInverse} />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          editable={canPost && !isPosting}
          placeholder={canPost ? PLACEHOLDER : DISABLED}
          placeholderTextColor={colors.textPlaceholder}
          multiline
          numberOfLines={1}
          maxFontSizeMultiplier={maxFontScale}
          accessibilityLabel={PLACEHOLDER}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
    paddingHorizontal: screenPadding,
    paddingVertical: spacing[12],
    gap: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: spacing[12],
  },
  input: {
    flex: 1,
    ...textStyles.label14,
    color: colors.textPrimary,
    textAlign: 'right',
    minHeight: SEND_SIZE,
    // Grows with the comment, then scrolls, so a long one cannot push the thread off screen.
    maxHeight: SEND_SIZE + MAX_LINES * textStyles.label14.lineHeight,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[10],
    borderRadius: radii[20],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  send: {
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
