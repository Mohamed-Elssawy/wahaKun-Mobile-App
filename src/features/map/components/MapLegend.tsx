import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

import { describeTierDisplay, TIER_ORDER } from '../tier';

import type { MapIssueTier } from '../types';

export type MapLegendProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

const CARD_WIDTH = 205;
const TOGGLE_SIZE = 48;
const TOGGLE_ICON = 24;
const SWATCH_WIDTH = 10;
const SWATCH_HEIGHT = 12;
const USER_DOT = 12;

// The legend swatch is the pin shape shrunk, not a dot, so the two read as the same thing.
const SWATCH_PATH =
  'M5 0C7.76142 0 10 2.23858 10 5C10 7.5 7.5 10.5 5 12C2.5 10.5 0 7.5 0 5C0 2.23858 2.23858 0 5 0Z';

function TierSwatch({ tier }: { tier: MapIssueTier }) {
  const { color } = describeTierDisplay(tier);

  return (
    <Svg width={SWATCH_WIDTH} height={SWATCH_HEIGHT} viewBox="0 0 10 12">
      <Path d={SWATCH_PATH} fill={colors[color]} />
    </Svg>
  );
}

/** F-05's legend: open when zoomed out, collapsed to its chevron when zoomed in. */
export function MapLegend({ isExpanded, onToggle }: MapLegendProps) {
  return (
    <View style={styles.container}>
      {isExpanded ? (
        <View style={styles.card}>
          <View style={styles.section}>
            <Text variant="label12" color="textSecondary" align="right">
              مستوى الخطورة
            </Text>

            {TIER_ORDER.map(tier => (
              <View key={tier} style={styles.row}>
                <Text variant="label12" align="right" style={styles.rowLabel}>
                  {describeTierDisplay(tier).label}
                </Text>
                <TierSwatch tier={tier} />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text variant="label12" color="textSecondary" align="right">
              موقعك
            </Text>
            <View style={styles.row}>
              <Text variant="label12" align="right" style={styles.rowLabel}>
                موقعك الحالي
              </Text>
              {/* A circle, not a teardrop: the farmer is not one of the problems. */}
              <View style={styles.userDot} />
            </View>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.toggle}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'إخفاء مفتاح الخريطة' : 'عرض مفتاح الخريطة'}
      >
        {isExpanded ? (
          <ChevronDown size={TOGGLE_ICON} color={colors.primary} />
        ) : (
          <ChevronUp size={TOGGLE_ICON} color={colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // The legend hangs off the right edge in the frame, and the toggle sits under it.
  container: {
    alignItems: 'flex-end',
    gap: spacing[8],
  },
  card: {
    width: CARD_WIDTH,
    padding: spacing[24],
    borderRadius: radii[12],
    backgroundColor: colors.surface,
    gap: spacing[12],
    ...shadows.card,
  },
  section: {
    gap: spacing[8],
  },
  // Plain row: the frame puts the swatch at the trailing edge, to the right of its label.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  rowLabel: {
    flex: 1,
  },
  userDot: {
    width: USER_DOT,
    height: USER_DOT,
    borderRadius: radii.pill,
    backgroundColor: colors.info,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  toggle: {
    width: TOGGLE_SIZE,
    height: TOGGLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
});
