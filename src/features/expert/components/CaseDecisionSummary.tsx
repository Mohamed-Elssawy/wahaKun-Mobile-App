import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { BiText, Text } from '@/components/ui';
import { describeSeverity } from '@/features/reports/severity';
import { t } from '@/i18n';
import { ForwardIcon } from '@/i18n/icons';
import { colors, radii, spacing } from '@/theme';

import type { ExpertReviewOverride } from '../types';

export type CaseDecisionSummaryProps = {
  override?: ExpertReviewOverride;
  onReview: () => void;
};

const LINK_ICON_SIZE = 16;

/** E-03's read-only قرار الخبير card; the frame governs layout only, the content comes from §8.3. */
export function CaseDecisionSummary({ override, onReview }: CaseDecisionSummaryProps) {
  const severity = override ? describeSeverity(override.severity) : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.text}>
          <Text variant="h5">
            {override ? t('expert.overrideTitle') : t('expert.overrideNoneTitle')}
          </Text>
          <Text variant="label14" color="textSecondary">
            {override ? t('expert.overrideReplaced') : t('expert.overrideAccepted')}
          </Text>
        </View>
      </View>

      {override ? (
        <View style={styles.details}>
          <Text variant="label12" color="textSecondary">
            {severity?.label}
          </Text>
          <BiText contentRole="body" variant="body14Bold">
            {override.correctedDiagnosis}
          </BiText>
        </View>
      ) : null}

      <TouchableOpacity style={styles.link} onPress={onReview} accessibilityRole="link">
        <Text variant="label12" color="primary">
          {t('f07.tab.review')}
        </Text>
        <ForwardIcon size={LINK_ICON_SIZE} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[12],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[16],
    gap: spacing[16],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  text: {
    flex: 1,
    gap: spacing[4],
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing[4],
  },
  details: {
    gap: spacing[4],
  },
});
