import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { Text } from './Text';

import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

/**
 * SYSTEM-SPEC §6.4. Four tints, one job each - green says the system did something, blue asks
 * the farmer for something, amber says the model is unsure, red is a hazard. Never pick one
 * for its colour.
 */
export type ContextChipTint = 'system' | 'action' | 'caution' | 'hazard';

export type ContextChipProps = {
  tint?: ContextChipTint;
  icon?: LucideIcon;
  label: string;
  /** F-06's confirmation node hangs its yes/no pair here. */
  trailing?: ReactNode;
};

const ICON_SIZE = 20;

type Tone = { fill: ColorToken; edge: ColorToken; ink: ColorToken; glyph: ColorToken };

// The 700 stops as ink: the 500s all fail 4.5:1 on their own tint.
const TONES: Record<ContextChipTint, Tone> = {
  system: {
    fill: 'primaryTint',
    edge: 'primaryMuted',
    ink: 'primaryPressed',
    glyph: 'primary',
  },
  action: { fill: 'infoTint', edge: 'infoMuted', ink: 'infoText', glyph: 'info' },
  caution: {
    fill: 'warningTint',
    edge: 'warningMuted',
    ink: 'warningText',
    glyph: 'warning',
  },
  hazard: { fill: 'errorTint', edge: 'errorMuted', ink: 'errorText', glyph: 'error' },
};

/** The chip F-06 hangs off a timeline node and F-07 puts inside an active card. */
export function ContextChip({
  tint = 'system',
  icon: Icon,
  label,
  trailing,
}: ContextChipProps) {
  const tone = TONES[tint];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors[tone.fill], borderColor: colors[tone.edge] },
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {/* Leading, so row-reverse puts it at the right edge where the frame draws it. */}
      {Icon ? <Icon size={ICON_SIZE} color={colors[tone.glyph]} /> : null}

      <Text variant="label12" color={tone.ink} align="right" style={styles.label}>
        {label}
      </Text>

      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[8],
    borderRadius: radii[12],
    borderWidth: 1,
  },
  // Takes the slack, so a trailing control stays pinned to the far edge.
  label: {
    flex: 1,
  },
});
