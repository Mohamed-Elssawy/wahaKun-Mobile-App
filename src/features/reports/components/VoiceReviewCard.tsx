import { Pause, Play, Repeat2 } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button, Text, VoiceWaveform } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, screenPadding, spacing } from '@/theme';

export type VoiceReviewCardProps = {
  isPlaying: boolean;
  /** 0 to 1, handed straight to `VoiceWaveform`. */
  progress: number;
  onTogglePlayback: () => void;
  onUseRecording: () => void;
  onDiscard: () => void;
};

const PLAY_SIZE = 90;
const PLAY_ICON_SIZE = 32;
const RETAKE_ICON_SIZE = 20;

/** F-02b mode:voice. Mirrors PhotoReview's two-button exit, not F-04's inline player. */
export function VoiceReviewCard({
  isPlaying,
  progress,
  onTogglePlayback,
  onUseRecording,
  onDiscard,
}: VoiceReviewCardProps) {
  return (
    <View style={styles.content}>
      <View style={styles.card}>
        <Text variant="h4" color="textStrong">
          {t('f04.voiceSectionTitle')}
        </Text>
        <VoiceWaveform progress={progress} />
      </View>

      <View style={styles.playControl}>
        <TouchableOpacity
          style={styles.play}
          onPress={onTogglePlayback}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t('common.pause') : t('common.playRecording')}
          accessibilityState={{ selected: isPlaying }}
        >
          {isPlaying ? (
            <Pause size={PLAY_ICON_SIZE} color={colors.textInverse} />
          ) : (
            <Play size={PLAY_ICON_SIZE} color={colors.textInverse} />
          )}
        </TouchableOpacity>
        <Text variant="label16" color="textSecondary" align="center">
          {isPlaying ? t('f02b.tapToPause') : t('f02b.tapToPlay')}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label={t('f02b.useRecording')} onPress={onUseRecording} showArrow />
        <Button
          label={t('x04.reRecord')}
          variant="secondary"
          onPress={onDiscard}
          icon={<Repeat2 size={RETAKE_ICON_SIZE} color={colors.primary} />}
          iconTrails
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    // Fills the screen so the two buttons sit at the bottom, as F-02b's frame pins them.
    flex: 1,
    gap: spacing[24],
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
  },
  card: {
    width: '100%',
    gap: spacing[16],
    paddingVertical: spacing[24],
    paddingHorizontal: screenPadding,
    borderRadius: radii[20],
    backgroundColor: colors.surface,
  },
  playControl: {
    alignItems: 'center',
    gap: spacing[8],
  },
  play: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: 'auto',
    gap: spacing[12],
  },
});
