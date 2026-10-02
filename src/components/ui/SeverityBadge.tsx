import { StyleSheet, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { colors, radii, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { Text } from './Text';

import type { StyleProp, ViewStyle } from 'react-native';

/** The visual tier, not a backend enum: each feature maps its own domain onto these four. */
export type SeverityLevel = 'critical' | 'medium' | 'low' | 'unknown';

export type SeverityBadgeProps = {
  level: SeverityLevel;
  /** Arabic, feminine, agreeing with الخطورة. */
  label: string;
  /** The fill. The caller's domain helper picks it, so a pin and a card cannot disagree. */
  color: ColorToken;
  /** Escape hatch for cross-axis alignment: the feed top-aligns it, the hero centres it. */
  style?: StyleProp<ViewStyle>;
};

/** Measured off the frame: 26 tall, and the label's ink sits 15 in from each rounded end. */
const HEIGHT = 26;
const GLYPH_SIZE = 12;

// The exclamation sits to the droplet's right inside the same box, so the badge can lay the
// whole thing out as one leading icon rather than juggling two.
const DROPLET =
  'M7 19.5c3.6 0 6.5-2.9 6.5-6.4 0-2.6-1.3-4.7-2.8-6.4C9.2 5 7.8 3.4 7 1.5 6.2 3.4 4.8 5 3.3 6.7 1.8 8.4.5 10.5.5 13.1c0 3.5 2.9 6.4 6.5 6.4z';

/** viewBox width; the droplet occupies the left 14 and the exclamation the right 5. */
const GLYPH_WIDTH_WITH_MARK = 20;
const GLYPH_WIDTH_PLAIN = 14;
const GLYPH_VIEWBOX_HEIGHT = 21;

const MARK_X = 16.4;

/**
 * Drawn rather than taken from lucide because the frame uses three variants of one droplet
 * and lucide has neither the filled one nor the exclamation.
 */
function Droplet({ level, size }: { level: SeverityLevel; size: number }) {
  const hasMark = level === 'critical';
  // Only low is drawn as an outline; unknown reads as a plain filled drop.
  const isOutlined = level === 'low';

  const width = hasMark ? GLYPH_WIDTH_WITH_MARK : GLYPH_WIDTH_PLAIN;
  const scale = size / GLYPH_VIEWBOX_HEIGHT;

  return (
    <Svg
      width={width * scale}
      height={size}
      viewBox={`0 0 ${width} ${GLYPH_VIEWBOX_HEIGHT}`}
    >
      <Path
        d={DROPLET}
        fill={isOutlined ? 'none' : colors.textInverse}
        stroke={isOutlined ? colors.textInverse : 'none'}
        strokeWidth={isOutlined ? 1.6 : 0}
        strokeLinejoin="round"
      />

      {hasMark ? (
        <>
          <Path
            d={`M${MARK_X} 5.5v7.6`}
            stroke={colors.textInverse}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <Path
            d={`M${MARK_X} 17.6v0.1`}
            stroke={colors.textInverse}
            strokeWidth={2.8}
            strokeLinecap="round"
          />
        </>
      ) : null}
    </Svg>
  );
}

/**
 * The filled severity pill on F-01, F-03a and F-04. The glyph is not decoration: SYSTEM-SPEC
 * §6.2 requires severity to carry shape as well as colour, since every hue here means more
 * than one thing.
 */
export function SeverityBadge({ level, label, color, style }: SeverityBadgeProps) {
  return (
    <View
      style={[styles.badge, { backgroundColor: colors[color] }, style]}
      accessibilityRole="text"
      accessibilityLabel={`الخطورة: ${label}`}
    >
      {/* First child, so row-reverse puts the glyph on the leading edge - to the right of
          the label, which is where the frame draws every icon on these screens. */}
      <Droplet level={level} size={GLYPH_SIZE} />

      <Text variant="h6" color="textInverse">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    minHeight: HEIGHT,
    paddingHorizontal: spacing[12],
    borderRadius: radii.pill,
  },
});
