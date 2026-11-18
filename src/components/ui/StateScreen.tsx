import { StyleSheet, View } from 'react-native';

import type { Locale } from '@/i18n';
import { colors, radii, screenPadding, scriptFonts, spacing } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

import type { LucideIcon } from 'lucide-react-native';

/** §5.4's two registers: blocking is red and the user cannot proceed, warm is green and guides. */
export type StateRegister = 'blocking' | 'warm';

export type StateScreenProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  /** showArrowEnd is G-02's backward arrow, for an action that returns rather than advances (S-08's "Back to home"); forward has no caller here. */
  action?: { label: string; onPress: () => void; showArrowEnd?: boolean };
  /** The non-obvious way out, e.g. voice instead of the camera on X-03. Ghost styling. */
  secondaryAction?: { label: string; onPress: () => void };
  register?: StateRegister;
  /** Sets the message's script face; only S-12's relaunch needs it, since label14/Inter carries no Arabic and falls back silently on Android. */
  script?: Locale;
};

const CIRCLE_SIZE = 100;
const ICON_SIZE = 44;

/** X-05, X-01 and the camera wall are one drawing. The 700 stops: the 500s fail 4.5:1. */
const REGISTERS = {
  blocking: { fill: colors.errorTint, glyph: colors.errorText },
  // F-03c's greens, the only warm redirect the design actually draws.
  warm: { fill: colors.primaryTint, glyph: colors.primaryPressed },
} as const;

export function StateScreen({
  icon: Icon,
  title,
  message,
  action,
  secondaryAction,
  register = 'blocking',
  script,
}: StateScreenProps) {
  const { fill, glyph } = REGISTERS[register];

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
          <Text
            variant="label14"
            color="textSecondary"
            align="center"
            style={script ? { fontFamily: scriptFonts[script].regular } : null}
          >
            {message}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {action ? (
          <Button
            label={action.label}
            onPress={action.onPress}
            showArrowEnd={action.showArrowEnd}
            script={script}
          />
        ) : null}
        {secondaryAction ? (
          <Button
            label={secondaryAction.label}
            variant="ghost"
            onPress={secondaryAction.onPress}
            script={script}
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
