import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, fonts, screenPadding, spacing } from '@/theme';

import palmTreeLogo from '@assets/images/palmTreeLogo.png';

import type { ReactNode } from 'react';

const ICON_WIDTH = 49;
const ICON_HEIGHT = 48;

export type BrandLockupProps = {
  /** Sits opposite the lockup, where S-02 puts the language control; omitted, the row stays layout-neutral. */
  trailing?: ReactNode;
};

/** The "Primary Logo" instance S-02 and the intro slides now share, so it lives in one place. */
export function BrandLockup({ trailing }: BrandLockupProps) {
  return (
    <View style={[styles.row, trailing ? styles.rowSpread : null]}>
      <View style={styles.lockup}>
        <Image source={palmTreeLogo} style={styles.icon} />
        <View style={styles.wordmark}>
          <Text variant="h4" color="primary">
            واحة كُن
          </Text>
          {/* Lora has no text style in Figma, so this one is composed from tokens. */}
          <Text style={styles.latin}>Waha KUN</Text>
        </View>
      </View>

      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    width: '100%',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[56],
  },
  rowSpread: {
    justifyContent: 'space-between',
  },
  // The group the lockup has always been, now named so something can sit opposite it.
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
  },
  icon: {
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    resizeMode: 'contain',
  },
  wordmark: {
    alignItems: 'flex-start',
  },
  latin: {
    fontFamily: fonts.latinStrong,
    fontSize: 20,
    lineHeight: 25,
    color: colors.primary,
  },
});
