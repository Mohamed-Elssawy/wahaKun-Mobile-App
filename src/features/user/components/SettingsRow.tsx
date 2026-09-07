import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type SettingsRowProps = {
  icon: LucideIcon;
  label: string;
  /** Shown under the label, e.g. the phone number on S-07. */
  value?: string;
  /** A switch instead of a chevron. Absent means the row navigates. */
  toggle?: { isOn: boolean; onChange: () => void };
  onPress?: () => void;
  /** Logout is the one destructive row. */
  tone?: Extract<ColorToken, 'primary' | 'error'>;
  /** Explains a setting that only lives on this device. */
  note?: string;
};

const ICON_SIZE = 24;
const CHEVRON_SIZE = 20;

/** One row inside a settings card. */
export function SettingsRow({
  icon: Icon,
  label,
  value,
  toggle,
  onPress,
  tone = 'primary',
  note,
}: SettingsRowProps) {
  const body = (
    <View style={styles.row}>
      <Icon size={ICON_SIZE} color={colors[tone]} />

      <View style={styles.text}>
        <Text
          variant="label16"
          color={tone === 'error' ? 'errorText' : 'textPrimary'}
          align="right"
        >
          {label}
        </Text>
        {value ? (
          <Text variant="label14" color="textMuted" align="right">
            {value}
          </Text>
        ) : null}
        {note ? (
          <Text variant="label12" color="textMuted" align="right">
            {note}
          </Text>
        ) : null}
      </View>

      {toggle ? (
        <Switch
          value={toggle.isOn}
          onValueChange={toggle.onChange}
          trackColor={{ true: colors.primary, false: colors.borderStrong }}
          thumbColor={colors.surface}
          accessibilityLabel={label}
        />
      ) : onPress ? (
        <ChevronLeft size={CHEVRON_SIZE} color={colors.textSecondary} />
      ) : null}
    </View>
  );

  // A toggle owns its own press target, so wrapping it would give the row two.
  if (!onPress || toggle) {
    return body;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
  },
  text: {
    flex: 1,
    gap: spacing[2],
  },
});
