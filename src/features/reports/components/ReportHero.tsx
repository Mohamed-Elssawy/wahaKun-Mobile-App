import { ChevronRight } from 'lucide-react-native';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { SeverityBadge } from './SeverityBadge';

import type { Severity } from '../types';

export type ReportHeroProps = {
  photoUrl?: string;
  title: string;
  severity?: Severity;
  onBack: () => void;
};

const HEIGHT = 215;
const CONTROL_SIZE = 40;

/** Flat scrim, not a gradient: one header does not justify a native module for it. */
export function ReportHero({ photoUrl, title, severity, onBack }: ReportHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={photoUrl ? { uri: photoUrl } : undefined}
      style={[styles.hero, { paddingTop: insets.top + spacing[8] }]}
      // Must be the prop: inside imageStyle it is ignored, leaving a band under a photo.
      resizeMode="cover"
    >
      <View style={styles.scrim} />

      <View style={styles.top}>
        <TouchableOpacity
          style={styles.control}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
        >
          <ChevronRight size={24} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        {severity ? <SeverityBadge severity={severity} /> : null}

        <Text variant="h4" color="textInverse" align="right" numberOfLines={2}>
          {title}
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: HEIGHT,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[16],
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'space-between',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  top: {
    flexDirection: 'row',
    // The frame's share control is unbuilt, so back sits alone at the leading edge.
    justifyContent: 'flex-start',
  },
  control: {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    alignItems: 'flex-end',
    gap: spacing[8],
  },
});
