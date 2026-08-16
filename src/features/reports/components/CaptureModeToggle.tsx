import { Camera, Mic } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, controlHeight, radii, shadows, spacing } from '@/theme';

import type { CaptureMode } from '../types';
import type { LucideIcon } from 'lucide-react-native';

export type CaptureModeToggleProps = {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
};

const ICON_SIZE = 20;

const OPTIONS: { mode: CaptureMode; label: string; Icon: LucideIcon }[] = [
  { mode: 'photo', label: 'صورة', Icon: Camera },
  { mode: 'voice', label: 'صوت', Icon: Mic },
];

/** Controlled, so the active mode and the body that swaps with it cannot disagree. */
// One recessed track with a raised thumb, not two buttons, matching the frame.
export function CaptureModeToggle({ mode, onChange }: CaptureModeToggleProps) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {OPTIONS.map(({ mode: optionMode, label, Icon }) => {
        const isSelected = optionMode === mode;
        // Selected sits on the cream thumb, unselected on the dark track.
        const foreground = isSelected ? colors.primary : colors.textInverse;

        return (
          <TouchableOpacity
            key={optionMode}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onChange(optionMode)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={label}
          >
            <Icon size={ICON_SIZE} color={foreground} />
            <Text variant="label16" color={isSelected ? 'primary' : 'textInverse'}>
              {label}
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
    alignSelf: 'stretch',
    backgroundColor: colors.primaryPressed,
    borderRadius: radii.pill,
    padding: spacing[4],
  },
  option: {
    // flex, not a fixed width: the halves stay equal at any size and font scale.
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    minHeight: controlHeight,
    paddingHorizontal: spacing[16],
    borderRadius: radii.pill,
  },
  // The fill and shadow are what read as raised, not the label colour alone.
  optionSelected: {
    backgroundColor: colors.background,
    zIndex: 1,
    ...shadows.card,
  },
});
