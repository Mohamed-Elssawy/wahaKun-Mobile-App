import { Check, X } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ContextChip } from '@/components/ui';
import { colors, radii } from '@/theme';

const QUESTION = 'هل تم إصلاح المشكلة؟';
const CONFIRM_LABEL = 'نعم، تم إصلاح المشكلة';
const REJECT_LABEL = 'لا، لم يتم إصلاح المشكلة';

const BUTTON_SIZE = 36;
const ICON_SIZE = 20;

export type TrackerApprovalControlProps = {
  onConfirm: () => void;
  onReject: () => void;
  disabled?: boolean;
};

/** §8.2's node-6 control. Single tap, no prompt: accept closes (T7), reject reopens (T8). */
export function TrackerApprovalControl({
  onConfirm,
  onReject,
  disabled = false,
}: TrackerApprovalControlProps) {
  return (
    <ContextChip
      tint="action"
      label={QUESTION}
      trailing={
        // The first child lands closest to the label in a row-reverse chip, so accept is listed first.
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.circle, styles.confirmCircle]}
            onPress={onConfirm}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={CONFIRM_LABEL}
          >
            <Check size={ICON_SIZE} color={colors.textInverse} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circle, styles.rejectCircle]}
            onPress={onReject}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={REJECT_LABEL}
          >
            <X size={ICON_SIZE} color={colors.textStrong} />
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectCircle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmCircle: {
    backgroundColor: colors.primary,
  },
});
