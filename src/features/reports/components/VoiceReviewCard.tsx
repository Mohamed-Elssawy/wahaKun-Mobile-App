import { Pause, Play, Repeat2 } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button, Text, VoiceWaveform } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

export type VoiceReviewCardProps = {
  isPlaying: boolean;
  /** 0 to 1, handed straight to `VoiceWaveform`. */
  progress: number;
  onTogglePlayback: () => void;
  onUseRecording: () => void;
  onDiscard: () => void;
};

const TITLE = 'التسجيل الصوتي';
const PLAY_SIZE = 90;
const PLAY_ICON_SIZE = 32;
const RETAKE_ICON_SIZE = 20;
const USE_RECORDING = 'استخدام هذا التسجيل';
const RE_RECORD = 'إعادة التسجيل';

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
        <Text variant="h4" color="textStrong" align="right">
          {TITLE}
        </Text>
        <VoiceWaveform progress={progress} />
      </View>

      <View style={styles.playControl}>
        <TouchableOpacity
          style={styles.play}
          onPress={onTogglePlayback}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'إيقاف التشغيل' : 'تشغيل التسجيل'}
          accessibilityState={{ selected: isPlaying }}
        >
          {isPlaying ? (
            <Pause size={PLAY_ICON_SIZE} color={colors.textInverse} />
          ) : (
            <Play size={PLAY_ICON_SIZE} color={colors.textInverse} />
          )}
        </TouchableOpacity>
        <Text variant="label16" color="textSecondary" align="center">
          {isPlaying ? 'اضغط للإيقاف' : 'اضغط للتشغيل'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label={USE_RECORDING} onPress={onUseRecording} showArrow />
        <Button
          label={RE_RECORD}
          variant="secondary"
          onPress={onDiscard}
          icon={<Repeat2 size={RETAKE_ICON_SIZE} color={colors.primary} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
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
    gap: spacing[12],
  },
});
