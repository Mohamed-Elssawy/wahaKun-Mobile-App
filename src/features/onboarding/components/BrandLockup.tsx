import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, fonts, screenPadding, spacing } from '@/theme';

import palmTreeLogo from '@assets/images/palmTreeLogo.png';

const ICON_WIDTH = 49;
const ICON_HEIGHT = 48;

/** The "Primary Logo" instance S-02 and the intro slides now share, so it lives in one place. */
export function BrandLockup() {
  return (
    <View style={styles.row}>
      <Image source={palmTreeLogo} style={styles.icon} />
      <View style={styles.wordmark}>
        <Text variant="h4" color="primary" align="right">
          واحة كُن
        </Text>
        {/* Lora has no text style in Figma, so this one is composed from tokens. */}
        <Text style={styles.latin}>Waha KUN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[10],
    width: '100%',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[56],
  },
  icon: {
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    resizeMode: 'contain',
  },
  wordmark: {
    alignItems: 'flex-end',
  },
  latin: {
    fontFamily: fonts.latinStrong,
    fontSize: 20,
    lineHeight: 25,
    color: colors.primary,
  },
});
