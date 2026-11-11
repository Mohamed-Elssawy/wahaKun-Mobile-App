import { Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type AiConfidenceChipProps = {
  diagnosis: string;
  /** 0 to 1, as normalized by the service layer. */
  confidence: number;
  /** Which side of the 80% threshold this sits on; presentational files may not read it (rule 2). */
  isConfident: boolean;
};

const CAPTION = 'ثقة';
const ICON_SIZE = 16;

/** E-01's card only: green above the 80% threshold, amber below, and the only sub-threshold view. */
export function AiConfidenceChip({
  diagnosis,
  confidence,
  isConfident,
}: AiConfidenceChipProps) {
  const percent = Math.round(confidence * 100);

  return (
    <View
      style={[styles.chip, isConfident ? styles.chipConfident : styles.chipLow]}
      accessibilityRole="text"
      accessibilityLabel={`${diagnosis} — ${CAPTION} ${percent}%`}
    >
      <Sparkles
        size={ICON_SIZE}
        color={colors[isConfident ? 'primaryPressed' : 'warningText']}
      />

      <Text
        variant="body12"
        color={isConfident ? 'primaryPressed' : 'warningText'}
        style={styles.diagnosis}
        numberOfLines={1}
      >
        {diagnosis}
      </Text>

      <Text variant="body12" color={isConfident ? 'primaryPressed' : 'warningText'}>
        {`— ${CAPTION} ${percent}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[10],
    borderWidth: 1,
    borderRadius: radii[12],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
  },
  chipConfident: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryPressed,
  },
  chipLow: {
    backgroundColor: colors.warningTint,
    borderColor: colors.warningText,
  },
  diagnosis: {
    flexShrink: 1,
  },
});
