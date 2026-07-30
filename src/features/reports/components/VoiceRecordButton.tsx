import { Mic } from 'lucide-react-native';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

const BUTTON_SIZE = 90;

/** Disabled: ReportService has no voice endpoint yet. */
export function VoiceRecordButton() {
  const notifyUnavailable = () => {
    Alert.alert('غير متاح حالياً', 'سيتم دعم البلاغ الصوتي قريبًا.');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={notifyUnavailable}
        accessibilityRole="button"
        accessibilityLabel="اضغط للتسجيل"
      >
        <Mic size={32} color={colors.textInverse} />
      </TouchableOpacity>
      <Text variant="label16" color="textMuted" align="center">
        اضغط للتسجيل
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
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
