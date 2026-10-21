import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

export type LiveWaveformProps = {
  /** 0 to 1, the current input level. Pushed in as a new bar on every change. */
  level: number;
};

const BAR_COUNT = 30;
const BAR_WIDTH = 3.5;
const MIN_BAR_HEIGHT = 4;
const MAX_BAR_HEIGHT = 50;

/** Every bar is a real mic sample: a rolling window of the last thirty ticks, oldest falling off. */
export function LiveWaveform({ level }: LiveWaveformProps) {
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0));

  useEffect(() => {
    setLevels(current => [...current.slice(1), level]);
  }, [level]);

  return (
    <View style={styles.row}>
      {levels.map((sample, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            { height: MIN_BAR_HEIGHT + sample * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) },
          ]}
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
    backgroundColor: colors.primary,
  },
});
