import { Mic } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

const BUTTON_SIZE = 90;

export type VoiceRecordButtonProps = {
  /** The caller has already resolved the microphone permission by the time this fires. */
  onPress: () => void;
};

/** Idle state's mic button (§8.2). Permission is the caller's concern, not this control's. */
export function VoiceRecordButton({ onPress }: VoiceRecordButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('common.tapToRecord')}
      >
        <Mic size={32} color={colors.textInverse} />
      </TouchableOpacity>
      <Text variant="label16" color="textSecondary" align="center">
        {t('common.tapToRecord')}
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
