import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, controlHeight, radii, switchSize } from '@/theme';

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** What the switch controls, for a screen reader. The visible label is the row's. */
  accessibilityLabel: string;
  disabled?: boolean;
};

// S-07's toggle, not RN's Switch - a 50x28 brand-green track. Thumb travels to the layout's END when checked; don't read its side off the frames (S-07's English export left it unmirrored).
export function Switch({
  checked,
  onChange,
  accessibilityLabel,
  disabled = false,
}: SwitchProps) {
  return (
    <TouchableOpacity
      style={[
        styles.track,
        checked ? styles.trackOn : styles.trackOff,
        checked ? styles.trackEnd : styles.trackStart,
        disabled && styles.trackDisabled,
      ]}
      onPress={() => onChange(!checked)}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
    >
      <View style={styles.thumb} />
    </TouchableOpacity>
  );
}

/** Lifts the 28dp track to Android's 48dp target without changing what is drawn. */
const inset = (controlHeight - switchSize.trackHeight) / 2;
const hitSlop = { top: inset, bottom: inset, left: 0, right: 0 };

const styles = StyleSheet.create({
  track: {
    width: switchSize.trackWidth,
    height: switchSize.trackHeight,
    borderRadius: radii.pill,
    padding: switchSize.thumbInset,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // flex-end is the layout's end, so the thumb lands left in Arabic and right in English.
  trackStart: {
    justifyContent: 'flex-start',
  },
  trackEnd: {
    justifyContent: 'flex-end',
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  // No frame draws an off switch, so this is chosen by role: borderControl gives WCAG 1.4.11's 3:1 where borderStrong only gave 1.50:1.
  trackOff: {
    backgroundColor: colors.borderControl,
  },
  trackDisabled: {
    backgroundColor: colors.disabled,
  },
  thumb: {
    width: switchSize.thumb,
    height: switchSize.thumb,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
});
