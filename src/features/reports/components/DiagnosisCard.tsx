import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

import type { ReactNode } from 'react';

export type DiagnosisCardProps = {
  title: string;
  children: ReactNode;
};

/** Chrome only. The contents are passed in, which is what keeps a variant prop away. */
export function DiagnosisCard({ title, children }: DiagnosisCardProps) {
  return (
    <View style={styles.card}>
      <Text variant="h4" align="right">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[20],
    padding: spacing[24],
    gap: spacing[16],
    ...shadows.card,
  },
});
