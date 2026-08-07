import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { VoiceWaveform } from './VoiceWaveform';

/** Not interactive yet: ReportService accepts only a photo, so there is no target. */
export function VoiceCaptureCard() {
  return (
    <View style={styles.card}>
      <Text variant="h4" color="textStrong" align="right">
        صف المشكلة بصوتك
      </Text>
      <VoiceWaveform />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    gap: spacing[16],
    paddingVertical: spacing[24],
    paddingHorizontal: screenPadding,
    borderRadius: radii[20],
    backgroundColor: colors.surface,
  },
});
