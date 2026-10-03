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

/**
 * §8.2's node-6 control, identical on `F-06` and the `F-07` card (§9.5). Single tap, no reason
 * prompt - ✓ closes permanently (T7), ✗ calls the reopen transition (T8). The blue card is the
 * same `ContextChip` the rest of the timeline draws; this only supplies its trailing pair.
 */
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
        // row-reverse, and this is the trailing child of a row-reverse chip: the FIRST item
        // here lands closest to the label (the export's right-hand button), the second lands
        // furthest out (its left-hand button) - so ✓ is listed before ✗, not after.
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
