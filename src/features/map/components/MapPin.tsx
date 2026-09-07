import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { colors } from '@/theme';

import { describeTierDisplay } from '../tier';

import type { MapIssueTier } from '../types';

export type MapPinProps = {
  tier: MapIssueTier;
};

// Figma's own paths from the F-05 pins. The teardrop is 19x24; 23x28 adds the 2pt outer stroke.
const WIDTH = 23;
const HEIGHT = 28;

const TEARDROP =
  'M22 11.4287C22 15.8141 19.6614 19.5821 17.3936 22.2188C15.1122 24.871 12.7868 26.5136 12.5654 26.667L12.5645 26.666C12.2515 26.8832 11.8803 27 11.5 27C11.1194 27 10.7476 26.8835 10.4346 26.666C10.2105 26.5107 7.8862 24.8692 5.60645 22.2188C3.33857 19.5821 1.00002 15.8141 1 11.4287V11.4277L1.01367 10.9102C1.14534 8.33178 2.23508 5.8868 4.08105 4.05469C6.04985 2.1007 8.71797 1.00313 11.499 1H11.501L12.0215 1.01367C14.6132 1.1441 17.0733 2.22292 18.9189 4.05469C20.888 6.00896 21.9968 8.66071 22 11.4277V11.4287Z';

/** Figma exports the medium and resolved pins on a 35x40 board, so their glyphs sit +6/+4. */
const WIDE_BOARD_OFFSET = 'translate(-6, -4)';

const GLYPH_STROKE = 1.5;

/** A filled drop with an exclamation beside it. */
function CriticalGlyph() {
  return (
    <G>
      <Path
        d="M7.13482 10.1788L9.67325 7.64038L12.2117 10.1788C13.6136 11.5807 13.6136 13.8537 12.2117 15.2556C10.8097 16.6575 8.53674 16.6575 7.13482 15.2556C5.73289 13.8537 5.73289 11.5807 7.13482 10.1788Z"
        fill={colors.textInverse}
        stroke={colors.textInverse}
      />
      <Path
        d="M15.97 18.045C15.6717 18.045 15.4168 17.9387 15.2053 17.7263C14.9938 17.5139 14.8881 17.2585 14.8881 16.9602C14.8881 16.6619 14.9943 16.4071 15.2067 16.1956C15.4191 15.9841 15.6745 15.8783 15.9728 15.8783C16.2711 15.8783 16.526 15.9845 16.7375 16.1969C16.949 16.4094 17.0547 16.6647 17.0547 16.963C17.0547 17.2613 16.9485 17.5162 16.7361 17.7277C16.5236 17.9392 16.2683 18.045 15.97 18.045ZM15.97 14.3307C15.6717 14.3307 15.4168 14.2246 15.2053 14.0125C14.9938 13.8002 14.8881 13.5452 14.8881 13.2473V7.98543C14.8881 7.68746 14.9943 7.43242 15.2067 7.22029C15.4191 7.00816 15.6745 6.9021 15.9728 6.9021C16.2711 6.9021 16.526 7.00816 16.7375 7.22029C16.949 7.43242 17.0547 7.68746 17.0547 7.98543V13.2473C17.0547 13.5452 16.9485 13.8002 16.7361 14.0125C16.5236 14.2246 16.2683 14.3307 15.97 14.3307Z"
        fill={colors.textInverse}
      />
    </G>
  );
}

/** A solid drop, no exclamation. */
function MediumGlyph() {
  return (
    <G transform={WIDE_BOARD_OFFSET}>
      <Path
        d="M20.5659 12.9965L17.5001 9.93066L14.4396 12.9965C13.8333 13.6024 13.4203 14.3745 13.2529 15.2152C13.0855 16.0559 13.1711 16.9273 13.499 17.7193C13.8269 18.5112 14.3823 19.1882 15.095 19.6645C15.8077 20.1407 16.6456 20.395 17.5028 20.395C18.3599 20.395 19.1979 20.1407 19.9105 19.6645C20.6232 19.1882 21.1786 18.5112 21.5065 17.7193C21.8344 16.9273 21.9201 16.0559 21.7526 15.2152C21.5852 14.3745 21.1722 13.6024 20.5659 12.9965Z"
        fill={colors.textInverse}
        stroke={colors.textInverse}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

/** An outlined drop: the same shape, drawn lighter, because the problem is smaller. */
function LowGlyph() {
  return (
    <G>
      <Path
        d="M8.51282 8.80688L11.7628 5.55688L15.0128 8.80688C16.8078 10.6018 16.8078 13.512 15.0128 15.3069C13.2179 17.1018 10.3077 17.1018 8.51282 15.3069C6.71789 13.512 6.71789 10.6018 8.51282 8.80688Z"
        stroke={colors.textInverse}
        strokeWidth={GLYPH_STROKE}
      />
      <Path
        d="M11.7628 14.7652C10.267 14.7652 9.05444 13.5526 9.05444 12.0569"
        stroke={colors.textInverse}
        strokeWidth={GLYPH_STROKE}
      />
    </G>
  );
}

/** A tick in a broken ring, which is the check F-05 draws on a fixed problem. */
function ResolvedGlyph() {
  return (
    <G transform={WIDE_BOARD_OFFSET}>
      <Path
        d="M22.9167 16.0018V16.5001C22.916 17.6682 22.5378 18.8047 21.8384 19.7402C21.139 20.6758 20.156 21.3602 19.0359 21.6914C17.9157 22.0226 16.7186 21.9828 15.6229 21.578C14.5272 21.1732 13.5917 20.4251 12.956 19.4452C12.3202 18.4653 12.0183 17.3061 12.0951 16.1406C12.172 14.9751 12.6235 13.8656 13.3824 12.9777C14.1414 12.0897 15.167 11.4709 16.3063 11.2135C17.4457 10.9561 18.6377 11.0739 19.7046 11.5493"
        stroke={colors.textInverse}
        strokeWidth={GLYPH_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22.9167 12.1667L17.5 17.5888L15.875 15.9638"
        stroke={colors.textInverse}
        strokeWidth={GLYPH_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

const GLYPHS: Record<MapIssueTier, () => React.JSX.Element> = {
  critical: CriticalGlyph,
  medium: MediumGlyph,
  low: LowGlyph,
  resolved: ResolvedGlyph,
};

/** One issue on the map. The glyph names the tier for anyone who cannot separate the hues. */
export function MapPin({ tier }: MapPinProps) {
  const { color, label } = describeTierDisplay(tier);
  const Glyph = GLYPHS[tier];

  return (
    <View style={styles.pin} accessibilityLabel={label}>
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Path d={TEARDROP} fill={colors[color]} stroke={colors.surface} strokeWidth={2} />
        <Glyph />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: WIDTH,
    height: HEIGHT,
  },
});
