import { StyleSheet, View } from 'react-native';

import { ProgressRing, Text } from '@/components/ui';
import { screenPadding, spacing } from '@/theme';

import type { AnalyzingMode } from '../types';

export type AnalyzingStatusProps = {
  mode: AnalyzingMode;
};

/** §8.4's three mode:working H1s; the subtitle underneath does not vary by mode. */
const TITLE: Record<AnalyzingMode, string> = {
  photo: 'يحلل الذكاء الاصطناعي الصورة',
  voice: 'يحلل الذكاء الاصطناعي تسجيلك',
  text: 'يحلل الذكاء الاصطناعي كتابتك',
};
const SUBTITLE = 'قد يستغرق هذا بضع ثوانٍ';

/** Hangs from the header rather than centring, and the group carries busy, not the ring. */
export function AnalyzingStatus({ mode }: AnalyzingStatusProps) {
  const title = TITLE[mode];

  return (
    <View
      style={styles.status}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={title}
      accessibilityState={{ busy: true }}
    >
      <ProgressRing />

      <View style={styles.text}>
        <Text variant="h4" align="center">
          {title}
        </Text>
        <Text variant="label14" color="textSecondary" align="center">
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
