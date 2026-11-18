import { Check, X } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ContextChip } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii } from '@/theme';

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
      label={t('f06.repairedQuestion')}
      trailing={
        // The first child lands closest to the label, so accept is listed first.
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.circle, styles.confirmCircle]}
            onPress={onConfirm}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t('f06.yesFixed')}
          >
            <Check size={ICON_SIZE} color={colors.textInverse} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circle, styles.rejectCircle]}
            onPress={onReject}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t('f06.notFixed')}
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
    flexDirection: 'row',
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
