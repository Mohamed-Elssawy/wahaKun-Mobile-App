import { Camera, Mic, Sun, ZoomIn } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

import WaterDropIcon from '@assets/icons/water-drop.svg';

import { PhotoTipTile } from './PhotoTipTile';

const TITLE = 'لم نتمكن من رؤية مشكلة واضحة في الصورة';
const SUBTITLE = 'تأكد أن الصورة تُظهر مصدر المشكلة بوضوح';
const RETAKE = 'التقاط صورة أخرى';
const USE_VOICE = 'أو صف المشكلة بصوتك بدلاً من ذلك';

const HERO_SIZE = 100;
const HERO_ICON_SIZE = 48;
const TIP_ICON_SIZE = 28;
const BUTTON_ICON_SIZE = 24;
const LINK_ICON_SIZE = 18;

// Figma strokes in absolute px, so divide by the scale lucide's 24-unit box draws at.
const HERO_STROKE = 1.5;
const TIP_STROKE = 1.75;

export type UnrecognizedPhotoStateProps = {
  /** The vision service's own Arabic reason and suggestion, when it sent one. */
  reason?: string;
  onRetakePhoto: () => void;
  onUseVoice: () => void;
};

/** F-03c. Not an error a retry fixes, so this shows what a readable photo looks like. */
export function UnrecognizedPhotoState({
  reason,
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
              {TITLE}
            </Text>
            {/* N700, not the frame's N500, which is 2.9:1 on this background. */}
            <Text variant="label14" color="textSecondary" align="center">
              {reason && reason !== TITLE ? reason : SUBTITLE}
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
            label="تسرب أو قناة أو أنبوب"
          />
          <PhotoTipTile
            icon={
              <Sun
                size={TIP_ICON_SIZE}
                strokeWidth={TIP_STROKE}
                color={colors.primaryPressed}
              />
            }
            label="في ضوء جيد"
          />
          <PhotoTipTile
            icon={
              <ZoomIn
                size={TIP_ICON_SIZE}
                strokeWidth={TIP_STROKE}
                color={colors.primaryPressed}
              />
            }
            label="وعن قرب"
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={RETAKE}
          onPress={onRetakePhoto}
          icon={<Camera size={BUTTON_ICON_SIZE} color={colors.textInverse} />}
        />

        {/* hitSlop, not a taller row: a 48dp box would push the button off its baseline. */}
        <TouchableOpacity
          style={styles.link}
          onPress={onUseVoice}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={USE_VOICE}
        >
          <Text variant="label14" color="primary">
            {USE_VOICE}
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
    flexDirection: 'row-reverse',
    gap: spacing[16],
  },
  actions: {
    gap: spacing[10],
  },
  link: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
});
