import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type ReportFailureStateProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
  /** The non-obvious way out, e.g. voice instead of the camera on X-03. Ghost styling. */
  secondaryAction?: { label: string; onPress: () => void };
  /** Queueing a report succeeds, and it uses this drawing to say so. */
  tone?: 'error' | 'success';
};

const CIRCLE_SIZE = 100;
const ICON_SIZE = 44;

/** X-05, X-01 and the camera wall are one drawing with a different glyph and copy. */
// The 700 stops, not the 500s: R500 and LG500 both fail 4.5:1 on their own tint.
const TONES = {
  error: { fill: colors.errorTint, glyph: colors.errorText },
  success: { fill: colors.successTint, glyph: colors.successText },
} as const;

export function ReportFailureState({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  tone = 'error',
}: ReportFailureStateProps) {
  const { fill, glyph } = TONES[tone];

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <View style={[styles.circle, { backgroundColor: fill }]}>
          <Icon size={ICON_SIZE} color={glyph} />
        </View>

        <View style={styles.text}>
          <Text variant="h4" align="center">
            {title}
          </Text>
          {/* N700, not N650: this copy is the only explanation of what went wrong. */}
          <Text variant="label14" color="textSecondary" align="center">
            {message}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {action ? <Button label={action.label} onPress={action.onPress} /> : null}
        {secondaryAction ? (
          <Button
            label={secondaryAction.label}
            variant="ghost"
            onPress={secondaryAction.onPress}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[32],
  },
  // Absorbs the leftover height, which is what holds the button at the bottom.
  group: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Figma's 21dp is glyph edge to glyph edge; h4's line box already adds a few.
    gap: spacing[16],
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    alignItems: 'center',
    gap: spacing[4],
  },
  actions: {
    gap: spacing[8],
  },
});
