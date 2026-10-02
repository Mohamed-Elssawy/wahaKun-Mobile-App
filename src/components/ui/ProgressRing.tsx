import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Svg, Circle } from 'react-native-svg';

import { colors } from '@/theme';

/** X-03 and F-03 both draw the ring at this size; F-04 shrinks it to 56. */
const DEFAULT_SIZE = 96;
const STROKE_RATIO = 8 / DEFAULT_SIZE;
// Thinner than the arc, so the fill reads as sitting on the groove rather than in it.
const TRACK_RATIO = 6 / DEFAULT_SIZE;
const INDETERMINATE_FRACTION = 0.2;

export type ProgressRingProps = {
  /** 0 to 1, clamped rather than rejected. Omit for the indeterminate spinner. */
  progress?: number;
  /** Outer diameter. Stroke widths scale with it, so the ring keeps its weight. */
  size?: number;
};

/** Radius subtracts half the stroke: an SVG stroke straddles its path and would clip. */
export function ProgressRing({ progress, size = DEFAULT_SIZE }: ProgressRingProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const isDeterminate = progress !== undefined;

  const stroke = size * STROKE_RATIO;
  const trackStroke = size * TRACK_RATIO;
  const radius = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (isDeterminate) {
      return;
    }

    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spin, isDeterminate]);

  const filled = isDeterminate
    ? Math.min(Math.max(progress, 0), 1)
    : INDETERMINATE_FRACTION;

  return (
    <Animated.View
      style={{
        transform: [
          {
            // -90deg so a filled arc grows from twelve, not the three o'clock SVG uses.
            rotate: isDeterminate
              ? '-90deg'
              : spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
          },
        ],
      }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.borderStrong}
          strokeWidth={trackStroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.primary}
          strokeWidth={stroke}
          strokeDasharray={[filled * circumference, (1 - filled) * circumference]}
        />
      </Svg>
    </Animated.View>
  );
}
