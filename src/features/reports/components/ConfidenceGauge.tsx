import { StyleSheet, View } from 'react-native';

import { ProgressRing, Text } from '@/components/ui';

export type ConfidenceGaugeProps = {
  /** 0 to 1, as normalized by the service layer. */
  confidence: number;
  /** A boolean, not a size: the design has exactly two presentations. */
  compact?: boolean;
};

const CAPTION = 'ثقة';
const COMPACT_SIZE = 56;

/** Label sits over the ring, not inside the Svg: svg text takes no typography tokens. */
export function ConfidenceGauge({ confidence, compact = false }: ConfidenceGaugeProps) {
  const percent = Math.round(confidence * 100);

  return (
    <View
      style={styles.gauge}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${CAPTION} ${percent}%`}
    >
      <ProgressRing progress={confidence} size={compact ? COMPACT_SIZE : undefined} />

      <View style={[StyleSheet.absoluteFill, styles.label]} pointerEvents="none">
        <Text variant={compact ? 'label12Bold' : 'h3'} color="primary">
          {percent}%
        </Text>
        {/* At 56dp a second line would crowd the percentage it exists to caption. */}
        {compact ? null : (
          <Text variant="label12" color="textMuted">
            {CAPTION}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gauge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
