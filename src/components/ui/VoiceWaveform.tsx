import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

export type VoiceWaveformProps = {
  /**
   * 0 to 1. Bars up to this point take the played colour. Omitted leaves every bar unplayed,
   * which is the capture card's case: nothing is playing there.
   */
  progress?: number;
};

/**
 * Measured off F-04: thirty bars in six rising-and-falling groups of five, 3.5 wide on a 9.5
 * pitch. Decorative - nothing here reads real audio - but the shape is the frame's, not a
 * guess, because a sparser bar set reads as a different component.
 */
const BAR_HEIGHTS = [
  11, 25, 38, 25, 11, 15, 32, 50, 32, 15, 11, 25, 38, 25, 11, 9, 20, 30, 20, 9, 12, 27,
  41, 27, 12, 13, 28, 44, 28, 13,
];

const BAR_WIDTH = 3.5;

/** The waveform on the voice capture card and on F-04's player. */
export function VoiceWaveform({ progress = 0 }: VoiceWaveformProps) {
  // Bars, not a clipped overlay: an overlay would cut one mid-bar and read as a rendering bug.
  const playedBars = Math.round(progress * BAR_HEIGHTS.length);
  // Fills from the right, following the reading direction. The row itself stays LTR so the
  // capture card's silhouette is unchanged.
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
