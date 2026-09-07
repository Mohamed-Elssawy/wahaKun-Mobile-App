import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

import type { ReactNode } from 'react';

export type SettingsSectionProps = {
  title: string;
  children: ReactNode[];
};

/** A titled card of rows, hairline-separated. S-07 has four of them. */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const rows = children.filter(Boolean);

  return (
    <View style={styles.section}>
      <Text variant="label14" color="textMuted" align="right">
        {title}
      </Text>

      <View style={styles.card}>
        {rows.map((row, index) => (
          // Index keys: these rows are a fixed, ordered list that never reorders.
          <Fragment key={index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[8],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[12],
    overflow: 'hidden',
    ...shadows.card,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[16],
    backgroundColor: colors.divider,
  },
});
