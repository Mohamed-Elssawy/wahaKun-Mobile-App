import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { BackIcon } from '@/i18n/icons';
import { colors, screenPadding, spacing } from '@/theme';

import { Text } from './Text';

import type { ReactNode } from 'react';

export type BackHeaderProps = {
  onBack: () => void;
  /** G-01: a green header with a title; omitted keeps the plain chevron-only header. */
  title?: string;
  /** Opposite the chevron on the plain header; S-03/S-03b put the language control here. */
  trailing?: ReactNode;
};

const CHEVRON_SIZE = 24;
// The same 110 bar AppHeader draws, since this is that bar with a different leading control.
const GREEN_HEIGHT = 110;
const GREEN_ROW_HEIGHT = 46;
const GREEN_PAD_BOTTOM = spacing[12];
const GREEN_PAD_TOP = GREEN_HEIGHT - GREEN_ROW_HEIGHT - GREEN_PAD_BOTTOM;

/** G-01 fixes the position; BackIcon picks the glyph from the locale. WizardHeader is the wizard's. */
export function BackHeader({ onBack, title, trailing }: BackHeaderProps) {
  const insets = useSafeAreaInsets();

  if (title) {
    return (
      <View
        style={[
          styles.green,
          { paddingTop: Math.max(GREEN_PAD_TOP, insets.top + spacing[4]) },
        ]}
      >
        <View style={styles.greenRow}>
          <Text variant="h3" color="textInverse" style={styles.greenTitle}>
            {title}
          </Text>

          <TouchableOpacity
            onPress={onBack}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <BackIcon size={CHEVRON_SIZE} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.header, trailing ? styles.headerSpread : null]}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <BackIcon size={CHEVRON_SIZE} color={colors.textStrong} />
      </TouchableOpacity>

      {trailing}
    </View>
  );
}

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[56],
    paddingBottom: spacing[12],
  },
  // Only applied when trailing is passed, so the chevron-only screens don't move.
  headerSpread: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  green: {
    backgroundColor: colors.primary,
    paddingHorizontal: screenPadding,
    paddingBottom: GREEN_PAD_BOTTOM,
  },
  greenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[24],
    height: GREEN_ROW_HEIGHT,
  },
  greenTitle: {
    flex: 1,
  },
});
