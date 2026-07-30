import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/** Measured from the Figma graphic. Decorative: nothing here reads real audio. */
const BAR_HEIGHTS = [
  32, 40, 52, 40, 32, 43, 46, 32, 53, 40, 36, 38, 42, 34, 50, 52, 40, 32,
];

const BAR_WIDTH = 6;

/** The static waveform shown on the (currently disabled) voice recording card. */
export function VoiceWaveform() {
  return (
    <View style={styles.row}>
      {BAR_HEIGHTS.map((height, index) => (
        <View key={index} style={[styles.bar, { height }]} />
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
});
