import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { screenPadding, spacing } from '@/theme';

import { ProgressRing } from './ProgressRing';

const TITLE = 'يحلل الذكاء الاصطناعي الصورة';
const SUBTITLE = 'قد يستغرق هذا بضع ثوانٍ';

/** Hangs from the header rather than centring: the frame is empty below the subtitle. */
// The group carries `busy`, not the ring, which is reused for a static gauge.
export function AnalyzingStatus() {
  return (
    <View
      style={styles.status}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={TITLE}
      accessibilityState={{ busy: true }}
    >
      <ProgressRing />

      <View style={styles.text}>
        <Text variant="h4" align="center">
          {TITLE}
        </Text>
        <Text variant="label12" color="textMuted" align="center">
          {SUBTITLE}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: 'center',
    paddingTop: spacing[40],
    paddingHorizontal: screenPadding,
    gap: spacing[16],
  },
  text: {
    alignItems: 'center',
    gap: spacing[4],
  },
});
