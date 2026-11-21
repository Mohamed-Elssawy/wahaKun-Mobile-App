import { StyleSheet, View } from 'react-native';

import { BiText, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type DiagnosisNoteProps = {
  icon: LucideIcon;
  /** F-04 labels each note; F-03a's title already says it, so it omits this. */
  label?: string;
  children: string;
};

const ICON_SIZE = 24;

export function DiagnosisNote({ icon: Icon, label, children }: DiagnosisNoteProps) {
  return (
    <View style={styles.row}>
      {/* The glyph takes the start edge, where the eye begins reading. */}
      <Icon size={ICON_SIZE} color={colors.primary} />

      <View style={styles.body}>
        {label ? (
          <Text variant="label14" color="textMuted">
            {label}
          </Text>
        ) : null}

        <BiText contentRole="body" variant="body14">
          {children}
        </BiText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    // Top, not centre: a wrapped paragraph should leave the glyph on its first line.
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  body: {
    flex: 1,
  },
});
