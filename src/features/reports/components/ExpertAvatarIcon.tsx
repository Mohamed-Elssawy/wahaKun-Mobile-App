import { User } from 'lucide-react-native';
import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import type { LucideProps } from 'lucide-react-native';
import type { Svg } from 'react-native-svg';

// A step over the chip's 20 dp glyphs: the frames draw the disc larger than the icons beside it.
const DISC_SIZE = spacing[24];
const GLYPH_SIZE = spacing[12];

/** C57's filled avatar disc, shaped as a LucideIcon so the chip can hand it a size it ignores. */
export const ExpertAvatarIcon = forwardRef<Svg, LucideProps>(({ color }, _ref) => (
  <View style={[styles.disc, { backgroundColor: color }]}>
    <User size={GLYPH_SIZE} color={colors.textInverse} />
  </View>
));

ExpertAvatarIcon.displayName = 'ExpertAvatarIcon';

const styles = StyleSheet.create({
  disc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
