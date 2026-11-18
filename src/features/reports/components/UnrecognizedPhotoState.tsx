import { Camera, Mic, Sun, ZoomIn } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, screenPadding, spacing } from '@/theme';

import WaterDropIcon from '@assets/icons/water-drop.svg';

import { PhotoTipTile } from './PhotoTipTile';

const HERO_SIZE = 100;
const HERO_ICON_SIZE = 48;
const TIP_ICON_SIZE = 28;
const BUTTON_ICON_SIZE = 24;
const LINK_ICON_SIZE = 18;

// Figma strokes in absolute px, so divide by the scale lucide's 24-unit box draws at.
const HERO_STROKE = 1.5;
const TIP_STROKE = 1.75;

export type UnrecognizedPhotoStateProps = {
  /** The vision service's own reason, never this screen's fallback copy — provenance, not text, decides. */
  serverReason?: string;
  onRetakePhoto: () => void;
  onUseVoice: () => void;
};

/** F-03c. Not an error a retry fixes, so this shows what a readable photo looks like. */
export function UnrecognizedPhotoState({
  serverReason,
  onRetakePhoto,
  onUseVoice,
}: UnrecognizedPhotoStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.hero}>
          <View style={styles.heroCircle}>
            {/* G700 on the G100 disc, as the frame draws every glyph on a tint. */}
            <Camera
              size={HERO_ICON_SIZE}
              strokeWidth={HERO_STROKE}
              color={colors.primaryPressed}
            />
          </View>

          <View style={styles.copy}>
            <Text variant="h4" align="center">
              {t('errors.report.unreadable')}
            </Text>
            {/* N700, not the frame's N500, which is 2.9:1 on this background. */}
            <Text variant="label14" color="textSecondary" align="center">
              {serverReason ?? t('f03c.subtitle')}
            </Text>
            <Text variant="label14" color="textSecondary" align="center">
              {t('f03c.notSavedLine')}
            </Text>
          </View>
        </View>

        {/* Right to left, because the three labels read as one sentence. */}
        <View style={styles.tips}>
          <PhotoTipTile
            icon={
              <WaterDropIcon
                width={TIP_ICON_SIZE}
                height={TIP_ICON_SIZE}
                color={colors.primaryPressed}
              />
            }
            label={t('f03c.tip.leak')}
          />
          <PhotoTipTile
            icon={
              <Sun
                size={TIP_ICON_SIZE}
                strokeWidth={TIP_STROKE}
                color={colors.primaryPressed}
              />
            }
            label={t('f03c.tip.light')}
          />
          <PhotoTipTile
            icon={
              <ZoomIn
                size={TIP_ICON_SIZE}
                strokeWidth={TIP_STROKE}
                color={colors.primaryPressed}
              />
            }
            label={t('f03c.tip.close')}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={t('f03c.retakeCta')}
          onPress={onRetakePhoto}
          icon={<Camera size={BUTTON_ICON_SIZE} color={colors.textInverse} />}
        />

        {/* hitSlop, not a taller row: a 48dp box would push the button off its baseline. */}
        <TouchableOpacity
          style={styles.link}
          onPress={onUseVoice}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={t('f03c.voiceInstead')}
        >
          <Text variant="label14" color="primary">
            {t('f03c.voiceInstead')}
          </Text>
          <Mic size={LINK_ICON_SIZE} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const hitSlop = { top: 16, bottom: 16, left: 16, right: 16 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[32],
    paddingBottom: spacing[32],
  },
  top: {
    gap: spacing[32],
  },
  hero: {
    alignItems: 'center',
    gap: spacing[16],
  },
  heroCircle: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: spacing[8],
  },
  tips: {
    flexDirection: 'row',
    gap: spacing[16],
  },
  actions: {
    gap: spacing[10],
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
});
