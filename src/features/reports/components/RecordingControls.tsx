import { Square, X } from 'lucide-react-native';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
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

// Alert stands in for the discard-confirm sheet §12.1 has not drawn yet.

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

    Alert.alert(t('f02.cancelRecordingTitle'), t('f02.cancelRecordingBody'), [
      { text: t('f02.keepRecording'), style: 'cancel' },
      { text: t('f02.cancelRecording'), style: 'destructive', onPress: onCancel },
    ]);
  };

  return (
    // F-02 draws the red stop on the far edge and إلغاء beside it, so cancel leads.
    <View style={styles.row}>
      <View style={styles.control}>
        <TouchableOpacity
          style={styles.cancel}
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        >
          <X size={CANCEL_ICON_SIZE} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text variant="label16" color="textSecondary" align="center">
          {t('common.cancel')}
        </Text>
      </View>

      <View style={styles.control}>
        <TouchableOpacity
          style={styles.stop}
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel={t('f02.tapToStop')}
        >
          <Square
            size={STOP_ICON_SIZE}
            color={colors.textInverse}
            fill={colors.textInverse}
          />
        </TouchableOpacity>
        <Text variant="label16" color="textSecondary" align="center">
          {t('f02.tapToStop')}
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
