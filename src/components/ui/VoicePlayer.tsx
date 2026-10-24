import { Pause, Play } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';
import { VoiceWaveform } from './VoiceWaveform';

export type VoicePlayerProps = {
  title: string;
  isPlaying: boolean;
  /** 0 to 1. The caller owns the player; this only draws its state. */
  progress: number;
  onToggle: () => void;
  /** Rendered under the row when playback failed. */
  errorMessage?: string;
};

/** 48 in the frame, sitting on the screen's left gutter with the waveform filling the rest. */
const BUTTON_SIZE = 48;
const ICON_SIZE = 22;

/** F-04's player over the recording attached to an issue. */
export function VoicePlayer({
  title,
  isPlaying,
  progress,
  onToggle,
  errorMessage,
}: VoicePlayerProps) {
  return (
    <View style={styles.section}>
      <Text variant="h4" align="right" color="textStrong">
        {title}
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
          onPress={onToggle}
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

      {errorMessage ? (
        <Text variant="label12" color="errorText" align="right">
          {errorMessage}
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
