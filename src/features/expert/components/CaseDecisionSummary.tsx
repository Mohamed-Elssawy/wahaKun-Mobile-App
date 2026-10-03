import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { describeSeverity } from '@/features/reports/severity';
import { colors, radii, spacing } from '@/theme';

import type { ExpertReviewOverride } from '../types';

export type CaseDecisionSummaryProps = {
  override?: ExpertReviewOverride;
  onReview: () => void;
};

const TITLE_ON = 'تجاوز تشخيص الذكاء الاصطناعي';
const SUBTITLE_ON = 'استبدل الخبير التشخيص بتشخيصه الخاص';
const TITLE_OFF = 'لم يتم تجاوز تشخيص الذكاء الاصطناعي';
const SUBTITLE_OFF = 'تم قبول تشخيص الذكاء الاصطناعي كما هو';
const REVIEW_LABEL = 'مراجعة';
const LINK_ICON_SIZE = 16;

/** §8.3's E-03 `قرار الخبير` card - read-only, unlike E-02's editable `CaseOverrideSection`. */
export function CaseDecisionSummary({ override, onReview }: CaseDecisionSummaryProps) {
  const severity = override ? describeSeverity(override.severity) : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.text}>
          <Text variant="h5" align="right">
            {override ? TITLE_ON : TITLE_OFF}
          </Text>
          <Text variant="label14" color="textSecondary" align="right">
            {override ? SUBTITLE_ON : SUBTITLE_OFF}
          </Text>
        </View>

        <TouchableOpacity style={styles.link} onPress={onReview} accessibilityRole="link">
          <Text variant="label14Bold" color="primary">
            {REVIEW_LABEL}
          </Text>
          <ChevronLeft size={LINK_ICON_SIZE} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {override ? (
        <View style={styles.details}>
          <Text variant="label12" color="textSecondary" align="right">
            {severity?.label}
          </Text>
          <Text variant="body14Bold" align="right">
            {override.correctedDiagnosis}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii[12],
    padding: spacing[16],
    gap: spacing[12],
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  text: {
    flex: 1,
    gap: spacing[4],
  },
  link: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
  details: {
    gap: spacing[4],
  },
});
