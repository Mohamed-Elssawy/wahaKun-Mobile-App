import { CheckCircle2, ChevronLeft } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AiDiagnosisCard, ConfidenceRing, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import { DiagnosisNote } from './DiagnosisNote';

const TITLE = 'تشخيص الذكاء الاصطناعي';
const EXPLANATION_LABEL = 'لماذا هذا التشخيص؟';
const RECOMMENDATION_LABEL = 'الإجراء الموصى به';
const FULL_DIAGNOSIS = 'التشخيص الكامل';
const LINK_ICON_SIZE = 18;

export type AiDiagnosisSummaryProps = {
  title: string;
  confidence: number;
  explanation?: string;
  recommendation?: string;
  /** Omitted where there is nowhere to send it yet. */
  onOpenFull?: () => void;
};

/**
 * F-04's inline AI block, extracted so E-02 can draw the same thing. `IssueDetailsScreen`
 * itself is left exactly as it is (`feature/expert-queue-and-review` leaves the farmer
 * surface untouched) - this is new, not a refactor of that screen.
 */
export function AiDiagnosisSummary({
  title,
  confidence,
  explanation,
  recommendation,
  onOpenFull,
}: AiDiagnosisSummaryProps) {
  return (
    <AiDiagnosisCard title={TITLE}>
      <View style={styles.summary}>
        <Text
          variant="h5"
          align="right"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.summaryTitle}
        >
          {title}
        </Text>
        <ConfidenceRing confidence={confidence} compact />
      </View>

      {explanation ? (
        <DiagnosisNote icon={CheckCircle2} label={EXPLANATION_LABEL}>
          {explanation}
        </DiagnosisNote>
      ) : null}

      {recommendation ? (
        <DiagnosisNote icon={CheckCircle2} label={RECOMMENDATION_LABEL}>
          {recommendation}
        </DiagnosisNote>
      ) : null}

      {onOpenFull ? (
        <TouchableOpacity
          style={styles.link}
          onPress={onOpenFull}
          accessibilityRole="link"
          accessibilityLabel={FULL_DIAGNOSIS}
        >
          <Text variant="label16Bold" color="primary">
            {FULL_DIAGNOSIS}
          </Text>
          <ChevronLeft size={LINK_ICON_SIZE} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </AiDiagnosisCard>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
  },
  summaryTitle: {
    flex: 1,
  },
  link: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[4],
    minHeight: 48,
  },
});
