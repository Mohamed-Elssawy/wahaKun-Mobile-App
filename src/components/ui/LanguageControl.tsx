import { Globe } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

import { Text } from './Text';

export type LanguageControlProps = {
  onPress: () => void;
};

const GLYPH = 24;

// Pre-login (§16.4, no S-07 yet). Names the language you'd switch TO, not the one you're in - scripts/i18n-invariant.js pins that pair.
export function LanguageControl({ onPress }: LanguageControlProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('s12.controlA11y')}
    >
      <Text variant="h5" color="textMuted">
        {t('s12.controlLabel')}
      </Text>
      <Globe size={GLYPH} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
});
