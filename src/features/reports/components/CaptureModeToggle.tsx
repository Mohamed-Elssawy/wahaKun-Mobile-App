import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

import type { CaptureMode } from '../types';

export type CaptureModeToggleProps = {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
};

const OPTIONS: { mode: CaptureMode; label: string }[] = [
  { mode: 'camera', label: 'كاميرا' },
  { mode: 'upload', label: 'صوت + صورة' },
];

/** Controlled, so the active mode and the body that swaps with it cannot disagree. */
// One recessed track with a raised thumb, not two buttons, matching the frame.
export function CaptureModeToggle({ mode, onChange }: CaptureModeToggleProps) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {OPTIONS.map(option => {
        const isSelected = option.mode === mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onChange(option.mode)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text variant="label16" color={isSelected ? 'primary' : 'background'}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row-reverse',
    alignSelf: 'center',
    backgroundColor: colors.primaryPressed,
    borderRadius: radii.pill,
    padding: spacing[2],
  },
  option: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[16],
    borderRadius: radii.pill,
  },
  // The scale and shadow are what read as raised, not just a different fill.
  optionSelected: {
    backgroundColor: colors.background,
    zIndex: 1,
    transform: [{ scale: 1.05 }],
    ...shadows.card,
  },
});
