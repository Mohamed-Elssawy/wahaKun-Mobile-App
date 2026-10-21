import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

export type VoiceWaveformProps = {
  /** 0 to 1. Bars up to this point take the played colour; omitted leaves every bar unplayed. */
  progress?: number;
};

/** Measured off F-04: thirty bars in six groups of five. Decorative, but the frame's shape. */
const BAR_HEIGHTS = [
  11, 25, 38, 25, 11, 15, 32, 50, 32, 15, 11, 25, 38, 25, 11, 9, 20, 30, 20, 9, 12, 27,
  41, 27, 12, 13, 28, 44, 28, 13,
];

const BAR_WIDTH = 3.5;

/** The waveform on the voice capture card and on F-04's player. */
export function VoiceWaveform({ progress = 0 }: VoiceWaveformProps) {
  // Bars, not a clipped overlay: an overlay would cut one mid-bar and read as a rendering bug.
  const playedBars = Math.round(progress * BAR_HEIGHTS.length);
  // Fills from the right, following the reading direction; the row itself stays LTR.
  const firstPlayed = BAR_HEIGHTS.length - playedBars;

  return (
    <View style={styles.row}>
      {BAR_HEIGHTS.map((height, index) => (
        <View
          key={index}
          style={[styles.bar, { height }, index >= firstPlayed && styles.barPlayed]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    backgroundColor: colors.primaryMuted,
  },
  barPlayed: {
    backgroundColor: colors.primary,
  },
});
