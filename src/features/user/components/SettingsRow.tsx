import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Switch, Text } from '@/components/ui';
import { ForwardIcon } from '@/i18n/icons';
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
        <Text variant="label16" color={tone === 'error' ? 'errorText' : 'textPrimary'}>
          {label}
        </Text>
        {value ? (
          <Text variant="label14" color="textMuted">
            {value}
          </Text>
        ) : null}
        {note ? (
          <Text variant="label12" color="textMuted">
            {note}
          </Text>
        ) : null}
      </View>

      {toggle ? (
        <Switch
          checked={toggle.isOn}
          onChange={toggle.onChange}
          accessibilityLabel={label}
        />
      ) : onPress ? (
        <ForwardIcon size={CHEVRON_SIZE} color={colors.textSecondary} />
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
    flexDirection: 'row',
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
