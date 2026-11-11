import { StyleSheet, View } from 'react-native';

import { LiveWaveform, Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

export type VoiceRecordingCardProps = {
  /** No cap: §8.2 is explicit there is no maximum recording length. */
  elapsedSeconds: number;
  /** 0 to 1, passed straight through to the waveform. */
  level: number;
};

const RECORDING_LABEL = 'جارِ التسجيل...';
const DOT_SIZE = 8;

/** m:ss with no leading zero on the minute, matching the frame's 0:10. */
function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/** `F-02 · mode:voice · state:recording`'s card (§8.2). */
export function VoiceRecordingCard({ elapsedSeconds, level }: VoiceRecordingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.status}>
          <View style={styles.dot} />
          <Text variant="h5" color="textStrong">
            {RECORDING_LABEL}
          </Text>
        </View>

        <View style={styles.timerBadge}>
          {/* LTR island per-style, not I18nManager — Western numerals read left to right. */}
          <Text variant="label14Bold" color="textStrong" style={styles.timerText}>
            {formatElapsed(elapsedSeconds)}
          </Text>
        </View>
      </View>

      <LiveWaveform level={level} />
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
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.error,
  },
  timerBadge: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  timerText: {
    writingDirection: 'ltr',
  },
});
