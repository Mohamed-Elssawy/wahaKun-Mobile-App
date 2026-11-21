import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { AiDiagnosisCard, BiText, ConfidenceRing, Text } from '@/components/ui';
import { t } from '@/i18n';
import { ForwardIcon } from '@/i18n/icons';
import { colors, spacing } from '@/theme';

import { DiagnosisNote } from './DiagnosisNote';

const LINK_ICON_SIZE = 18;

export type AiDiagnosisSummaryProps = {
  title: string;
  confidence: number;
  explanation?: string;
  recommendation?: string;
  /** Omitted where there is nowhere to send it yet. */
  onOpenFull?: () => void;
};

/** F-04's inline AI block, extracted so E-02 can draw the same thing. */
export function AiDiagnosisSummary({
  title,
  confidence,
  explanation,
  recommendation,
  onOpenFull,
}: AiDiagnosisSummaryProps) {
  return (
    <AiDiagnosisCard title={t('common.aiDiagnosis')}>
      <View style={styles.summary}>
        <BiText
          contentRole="title"
          variant="h5"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.summaryTitle}
        >
          {title}
        </BiText>
        <ConfidenceRing confidence={confidence} compact />
      </View>

      {explanation ? (
        <DiagnosisNote icon={CheckCircle2} label={t('common.whyThisDiagnosis')}>
          {explanation}
        </DiagnosisNote>
      ) : null}

      {recommendation ? (
        <DiagnosisNote icon={CheckCircle2} label={t('common.recommendedAction')}>
          {recommendation}
        </DiagnosisNote>
      ) : null}

      {onOpenFull ? (
        <TouchableOpacity
          style={styles.link}
          onPress={onOpenFull}
          accessibilityRole="link"
          accessibilityLabel={t('common.fullDiagnosis')}
        >
          <Text variant="label12" color="primary">
            {t('common.fullDiagnosis')}
          </Text>
          <ForwardIcon size={LINK_ICON_SIZE} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </AiDiagnosisCard>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  summaryTitle: {
    flex: 1,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing[4],
    minHeight: 48,
  },
});
