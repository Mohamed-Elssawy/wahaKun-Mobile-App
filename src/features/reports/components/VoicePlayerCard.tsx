import { Pause, Play } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors, radii, spacing } from '@/theme';

import { VoiceWaveform } from './VoiceWaveform';

export type VoicePlayerCardProps = {
  voiceUrl: string;
};

const TITLE = 'التسجيل الصوتي';
const FAILED = 'تعذر تشغيل التسجيل';

/** 48 in the frame, sitting on the screen's left gutter with the waveform filling the rest. */
const BUTTON_SIZE = 48;
const ICON_SIZE = 22;

/** F-04's player over the recording attached to an issue. */
export function VoicePlayerCard({ voiceUrl }: VoicePlayerCardProps) {
  const { isPlaying, progress, hasFailed, toggle } = useAudioPlayer(voiceUrl);

  return (
    <View style={styles.section}>
      <Text variant="h4" align="right" color="textStrong">
        {TITLE}
      </Text>

      {/* Waveform leading at the right, button on the trailing edge: the frame puts the
          control at the left gutter, opposite the heading. */}
      <View style={styles.row}>
        {/* The waveform is the graphic from the frame, not the real envelope: nothing decodes
            the audio, so the played part is filled in rather than drawn from samples. */}
        <View style={styles.waveform}>
          <VoiceWaveform progress={progress} />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'إيقاف التشغيل' : 'تشغيل التسجيل'}
          accessibilityState={{ selected: isPlaying }}
        >
          {/* Outlined, not filled: the frame draws a stroked triangle on the green disc. */}
          {isPlaying ? (
            <Pause size={ICON_SIZE} color={colors.textInverse} />
          ) : (
            <Play size={ICON_SIZE} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>

      {hasFailed ? (
        <Text variant="label12" color="errorText" align="right">
          {FAILED}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[12],
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
  },
});
