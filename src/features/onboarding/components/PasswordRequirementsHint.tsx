import { Check, Circle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import { PASSWORD_RULES } from '../passwordRules';

export type PasswordRequirementsHintProps = {
  password: string;
};

const ICON_SIZE = 14;

/** S-05.3's live per-rule hint: each rule turns green the moment it is met. */
export function PasswordRequirementsHint({ password }: PasswordRequirementsHintProps) {
  return (
    <View style={styles.list}>
      {PASSWORD_RULES.map(rule => {
        const met = rule.test(password);
        return (
          <View key={rule.id} style={styles.row}>
            {met ? (
              <Check size={ICON_SIZE} color={colors.success} />
            ) : (
              <Circle size={ICON_SIZE} color={colors.textMuted} />
            )}
            <Text variant="label12" color={met ? 'successText' : 'textMuted'}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[4],
  },
  row: {
    // row-reverse: Arabic label on the right, icon leading it on the left.
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
});
