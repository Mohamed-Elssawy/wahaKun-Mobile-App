import { ChevronRight, Mic, Share2 } from 'lucide-react-native';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { SeverityBadge } from './SeverityBadge';

import type { Severity } from '../types';
import type { ReactNode } from 'react';

export type ReportHeroProps = {
  photoUrl?: string;
  title: string;
  severity?: Severity;
  onBack: () => void;
  /** F-04's share control. Omitted leaves back alone, which is how F-03a draws it. */
  onShare?: () => void;
  /** Replaces SeverityBadge when the tier is what the screen knows, not the model's severity. */
  badge?: ReactNode;
  /** Draws the mic placeholder behind the scrim when a voice report has no photo. */
  hasVoice?: boolean;
};

const HEIGHT = 215;
const CONTROL_SIZE = 40;
const CONTROL_ICON = 24;
const PLACEHOLDER_ICON = 48;

/** Flat scrim, not a gradient: one header does not justify a native module for it. */
export function ReportHero({
  photoUrl,
  title,
  severity,
  onBack,
  onShare,
  badge,
  hasVoice = false,
}: ReportHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={photoUrl ? { uri: photoUrl } : undefined}
      style={[styles.hero, { paddingTop: insets.top + spacing[8] }]}
      // Must be the prop: inside imageStyle it is ignored, leaving a band under a photo.
      resizeMode="cover"
    >
      {/* Under the scrim, so the title keeps its contrast over the placeholder too. */}
      {!photoUrl && hasVoice ? (
        <View style={styles.placeholder}>
          <Mic size={PLACEHOLDER_ICON} color={colors.primary} />
        </View>
      ) : null}

      <View style={styles.scrim} />

      <View style={styles.top}>
        <TouchableOpacity
          style={styles.control}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
        >
          <ChevronRight size={CONTROL_ICON} color={colors.textInverse} />
        </TouchableOpacity>

        {onShare ? (
          <TouchableOpacity
            style={styles.control}
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="مشاركة البلاغ"
          >
            <Share2 size={CONTROL_ICON} color={colors.textInverse} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.bottom}>
        {badge ?? (severity ? <SeverityBadge severity={severity} /> : null)}

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
  placeholder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  top: {
    // Back leads at the right in an RTL layout; share takes the opposite edge.
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
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
