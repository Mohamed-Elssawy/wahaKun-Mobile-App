import { Mic } from 'lucide-react-native';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

const BUTTON_SIZE = 90;

export type VoiceRecordButtonProps = {
  /** Resolves false when the farmer refuses, which is what raises X-04. */
  onRequestPermission: () => Promise<boolean>;
  onPermissionDenied: () => void;
};

/** The permission half is real (X-04 comes through here); recording itself is not built. */
export function VoiceRecordButton({
  onRequestPermission,
  onPermissionDenied,
}: VoiceRecordButtonProps) {
  const handlePress = async () => {
    const isGranted = await onRequestPermission();

    if (!isGranted) {
      onPermissionDenied();
      return;
    }

    Alert.alert('غير متاح حالياً', 'سيتم دعم البلاغ الصوتي قريبًا.');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="اضغط للتسجيل"
      >
        <Mic size={32} color={colors.textInverse} />
      </TouchableOpacity>
      <Text variant="label16" color="textSecondary" align="center">
        اضغط للتسجيل
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing[8],
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
