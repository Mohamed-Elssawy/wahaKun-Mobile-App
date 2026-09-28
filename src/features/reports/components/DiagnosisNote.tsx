import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type DiagnosisNoteProps = {
  icon: LucideIcon;
  /**
   * F-04 labels each note - "الأعراض المطابقة", "الإجراء الموصى به" - because its card title
   * names the diagnosis rather than the paragraph. F-03a's title already says it, so it omits
   * this and the note reads as one block.
   */
  label?: string;
  children: string;
};

const ICON_SIZE = 24;

export function DiagnosisNote({ icon: Icon, label, children }: DiagnosisNoteProps) {
  return (
    <View style={styles.row}>
      {/* row-reverse puts the glyph on the right, where the eye starts in Arabic. */}
      <Icon size={ICON_SIZE} color={colors.primary} />

      <View style={styles.body}>
        {label ? (
          <Text variant="label14" color="textMuted" align="right">
            {label}
          </Text>
        ) : null}

        <Text variant="body14" align="right">
          {children}
        </Text>
      </View>
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
  body: {
    flex: 1,
  },
});
