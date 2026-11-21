import { Camera, Mic } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { colors, radii, shadows, spacing } from '@/theme';

import type { CaptureMode } from '../types';
import type { LucideIcon } from 'lucide-react-native';

export type CaptureModeToggleProps = {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
};

const ICON_SIZE = 20;
// The frame draws each half 40 dp tall; the slop keeps the touch target at Android's 48.
const OPTION_HIT_SLOP = { top: spacing[4], bottom: spacing[4] };

// B-TOGGLE: photo leads, voice trails — intentional, don't swap it back per the old §722 reading.
const OPTIONS: { mode: CaptureMode; labelKey: TranslationKey; Icon: LucideIcon }[] = [
  { mode: 'photo', labelKey: 'f02.mode.photo', Icon: Camera },
  { mode: 'voice', labelKey: 'f02.mode.voice', Icon: Mic },
];

/** Controlled, so the active mode and the body that swaps with it cannot disagree. */
export function CaptureModeToggle({ mode, onChange }: CaptureModeToggleProps) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {OPTIONS.map(({ mode: optionMode, labelKey, Icon }) => {
        const isSelected = optionMode === mode;
        const label = t(labelKey);
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
            hitSlop={OPTION_HIT_SLOP}
          >
            <Icon size={ICON_SIZE} color={foreground} />
            <Text variant="h5" color={isSelected ? 'primary' : 'textInverse'}>
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
    flexDirection: 'row',
    // C39: a compact pill centred under the title (the frame's is ~250 dp), not the full width.
    alignSelf: 'stretch',
    marginHorizontal: spacing[40],
    backgroundColor: colors.primaryPressed,
    borderRadius: radii.pill,
    padding: spacing[4],
  },
  option: {
    // flex, not a fixed width: the halves stay equal at any size and font scale.
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    minHeight: spacing[40],
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
