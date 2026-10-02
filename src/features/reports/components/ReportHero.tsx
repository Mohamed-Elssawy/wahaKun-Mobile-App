import { ChevronRight, Mic, Share2 } from 'lucide-react-native';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import { SeverityBadge, Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { describeSeverity } from '../severity';

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

const HEIGHT = 204;
const CONTROL_SIZE = 40;
const CONTROL_ICON = 22;
const PLACEHOLDER_ICON = 48;

/** The title needs this much cover; above it the photo stays at full brightness. */
const SCRIM_HEIGHT = 110;

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
  const tone = severity ? describeSeverity(severity) : undefined;

  return (
    <ImageBackground
      source={photoUrl ? { uri: photoUrl } : undefined}
      style={[styles.hero, { paddingTop: insets.top + spacing[8] }]}
      // Must be the prop: inside imageStyle it is ignored, leaving a band under a photo.
      resizeMode="cover"
    >
      {!photoUrl && hasVoice ? (
        <View style={styles.placeholder}>
          <Mic size={PLACEHOLDER_ICON} color={colors.primary} />
        </View>
      ) : null}

      {/* A gradient over the lower third, not a flat wash over the whole photo: the frame
          keeps the image at full brightness behind the controls and darkens only the title.
          Drawn with react-native-svg, which is already here for the progress rings. */}
      <Svg style={styles.scrim} width="100%" height={SCRIM_HEIGHT}>
        <Defs>
          <LinearGradient id="heroScrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.shadow} stopOpacity="0" />
            <Stop offset="1" stopColor={colors.shadow} stopOpacity="0.65" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={SCRIM_HEIGHT} fill="url(#heroScrim)" />
      </Svg>

      <View style={styles.top}>
        <TouchableOpacity
          style={styles.control}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
        >
          <ChevronRight size={CONTROL_ICON} color={colors.textPrimary} />
        </TouchableOpacity>

        {onShare ? (
          <TouchableOpacity
            style={styles.control}
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="مشاركة البلاغ"
          >
            <Share2 size={CONTROL_ICON} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Badge beside the title, not above it: the frame puts it on the opposite edge of the
          same row, so a two-line title wraps past it rather than pushing it down. */}
      <View style={styles.bottom}>
        <Text
          variant="h4"
          color="textInverse"
          align="right"
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Text>

        {badge ??
          (tone ? (
            <SeverityBadge level={tone.tier} label={tone.label} color={tone.color} />
          ) : null)}
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
    right: 0,
    bottom: 0,
    left: 0,
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
    // Solid white with a dark glyph, as the frame draws it - not a translucent scrim disc.
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
  },
  title: {
    flex: 1,
  },
});
