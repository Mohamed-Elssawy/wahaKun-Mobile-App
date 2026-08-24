import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type DiagnosisNoteProps = {
  icon: LucideIcon;
  children: string;
};

const ICON_SIZE = 24;

/** No inline label: the card title already says what the paragraph is. */
export function DiagnosisNote({ icon: Icon, children }: DiagnosisNoteProps) {
  return (
    <View style={styles.row}>
      {/* row-reverse puts the glyph on the right, where the eye starts in Arabic. */}
      <Icon size={ICON_SIZE} color={colors.primary} />

      <Text variant="body14" align="right" style={styles.text}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    // Top, not centre: a wrapped paragraph should leave the glyph on its first line.
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  text: {
    flex: 1,
  },
});
