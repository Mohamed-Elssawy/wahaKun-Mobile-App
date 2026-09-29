import { Path, Svg } from 'react-native-svg';

import type { MapIssueTier } from '@/features/map/types';

export type SeverityDropletProps = {
  tier: MapIssueTier;
  color: string;
  size?: number;
};

/**
 * The glyph on a severity badge. Drawn rather than taken from lucide because the frame uses
 * three variants of one droplet and lucide has neither the filled one nor the exclamation.
 */
// The exclamation sits to the droplet's right inside the same box, so the badge can lay the
// whole thing out as one leading icon rather than juggling two.
const DROPLET =
  'M7 19.5c3.6 0 6.5-2.9 6.5-6.4 0-2.6-1.3-4.7-2.8-6.4C9.2 5 7.8 3.4 7 1.5 6.2 3.4 4.8 5 3.3 6.7 1.8 8.4.5 10.5.5 13.1c0 3.5 2.9 6.4 6.5 6.4z';

/** viewBox width; the droplet occupies the left 14 and the exclamation the right 5. */
const WIDTH_WITH_MARK = 20;
const WIDTH_PLAIN = 14;
const HEIGHT = 21;

const MARK_X = 16.4;

export function SeverityDroplet({ tier, color, size = 14 }: SeverityDropletProps) {
  const hasMark = tier === 'critical';
  // Resolved never reaches a badge, so only low is drawn as an outline.
  const isOutlined = tier === 'low';

  const width = hasMark ? WIDTH_WITH_MARK : WIDTH_PLAIN;
  const scale = size / HEIGHT;

  return (
    <Svg width={width * scale} height={size} viewBox={`0 0 ${width} ${HEIGHT}`}>
      <Path
        d={DROPLET}
        fill={isOutlined ? 'none' : color}
        stroke={isOutlined ? color : 'none'}
        strokeWidth={isOutlined ? 1.6 : 0}
        strokeLinejoin="round"
      />

      {hasMark ? (
        <>
          <Path
            d={`M${MARK_X} 5.5v7.6`}
            stroke={color}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <Path
            d={`M${MARK_X} 17.6v0.1`}
            stroke={color}
            strokeWidth={2.8}
            strokeLinecap="round"
          />
        </>
      ) : null}
    </Svg>
  );
}
