import { Square, X } from 'lucide-react-native';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type RecordingControlsProps = {
  elapsedSeconds: number;
  onStop: () => void;
  onCancel: () => void;
};

const STOP_SIZE = 90;
const CANCEL_SIZE = 64;
const STOP_ICON_SIZE = 28;
const CANCEL_ICON_SIZE = 24;

/** Below this, cancelling throws away too little for a confirm to be worth the interruption. */
const CANCEL_CONFIRM_SECONDS = 3;

const STOP_LABEL = 'اضغط لإيقاف التسجيل';
const CANCEL_LABEL = 'إلغاء';
// Alert stands in for the discard-confirm sheet §12.1 has not drawn yet.
const CONFIRM_TITLE = 'إلغاء التسجيل؟';
const CONFIRM_MESSAGE = 'سيُفقد ما تم تسجيله حتى الآن.';
const CONFIRM_DESTRUCTIVE = 'إلغاء التسجيل';
const CONFIRM_DISMISS = 'الاستمرار في التسجيل';

/** state:recording's two controls, laid out as the frame draws them, not RTL-leading. */
export function RecordingControls({
  elapsedSeconds,
  onStop,
  onCancel,
}: RecordingControlsProps) {
  const handleCancel = () => {
    if (elapsedSeconds < CANCEL_CONFIRM_SECONDS) {
      onCancel();
      return;
    }

    Alert.alert(CONFIRM_TITLE, CONFIRM_MESSAGE, [
      { text: CONFIRM_DISMISS, style: 'cancel' },
      { text: CONFIRM_DESTRUCTIVE, style: 'destructive', onPress: onCancel },
    ]);
  };

  return (
    <View style={styles.row}>
      <View style={styles.control}>
        <TouchableOpacity
          style={styles.stop}
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel={STOP_LABEL}
        >
          <Square
            size={STOP_ICON_SIZE}
            color={colors.textInverse}
            fill={colors.textInverse}
          />
        </TouchableOpacity>
        <Text variant="label16" color="textSecondary" align="center">
          {STOP_LABEL}
        </Text>
      </View>

      <View style={styles.control}>
        <TouchableOpacity
          style={styles.cancel}
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel={CANCEL_LABEL}
        >
          <X size={CANCEL_ICON_SIZE} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text variant="label16" color="textSecondary" align="center">
          {CANCEL_LABEL}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing[40],
  },
  control: {
    alignItems: 'center',
    gap: spacing[8],
  },
  stop: {
    width: STOP_SIZE,
    height: STOP_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    width: CANCEL_SIZE,
    height: CANCEL_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    // Centres against the taller stop control, which has no border to eat into its box.
    marginTop: (STOP_SIZE - CANCEL_SIZE) / 2,
  },
});
