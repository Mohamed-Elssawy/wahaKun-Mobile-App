import { CheckCircle2, Sparkles } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AiDiagnosisCard,
  BiText,
  ConfidencePill,
  ProgressRing,
  SeverityBadge,
  Text,
} from '@/components/ui';
import { t } from '@/i18n';
import { colors, screenPadding, spacing } from '@/theme';

import { seesAi } from '../aiVisibility';
import { CaptureNotice } from './CaptureNotice';
import { CollapsibleCard } from './CollapsibleCard';
import { DiagnosisNote } from './DiagnosisNote';
import { EscalationReviewerNotice } from './EscalationReviewerNotice';
import { RepairStepsList } from './RepairStepsList';
import { ReportErrorView } from './ReportErrorView';
import { ReportHeader } from './ReportHeader';
import { describeSeverity } from '../severity';

import type { ReportError } from '../errors';
import type { Audience } from '../lifecycle';
import type { DiagnosisContent } from '../types';

export type DiagnosisViewProps = {
  /** Null while loading, on error, or when the report carries no analysis at all. */
  content: DiagnosisContent | null;
  isLoading: boolean;
  error: ReportError | null;
  onRetry: () => void;
  /** §10.2: the expert sees sub-threshold output; the farmer gets F-03b instead. */
  audience: Audience;
  onBack: () => void;
  /** F-03b's CTA. Omitted on E-11: an expert has no farmer tracker of this report to open. */
  onOpenTracker?: () => void;
};

/** F-03a and E-11: the frame's symptom and cost lines have no endpoint, so both are left out. */
export function DiagnosisView({
  content,
  isLoading,
  error,
  onRetry,
  audience,
  onBack,
  onOpenTracker,
}: DiagnosisViewProps) {
  const isEscalated = content
    ? !seesAi(audience, { confidence: content.confidence })
    : false;

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centred}>
          <ProgressRing />
        </View>
      );
    }

    if (error) {
      return (
        <ReportErrorView
          error={error}
          unknownTitle={t('f03a.loadErrorTitle')}
          onRetry={onRetry}
        />
      );
    }

    // A report can exist without analysis, and this screen has nothing to say then.
    if (!content) {
      return (
        <CaptureNotice title={t('f03a.noneTitle')} message={t('f03a.notReadyBody')} />
      );
    }

    // T2: below the threshold, or on a transcription failure, the farmer sees none of this.
    if (isEscalated) {
      // G7: no resolver exists for a reviewer or for stats, so both stay unset.
      return <EscalationReviewerNotice onOpenTracker={onOpenTracker} />;
    }

    const severityTone = describeSeverity(content.severity);

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* The problem is the headline; confidence is a footnote in the row below. */}
        <View style={styles.summary}>
          <BiText contentRole="title" variant="h3" align="center">
            {content.title || t('f03a.unspecifiedTitle')}
          </BiText>

          <View style={styles.severity}>
            <Text variant="body14" color="textSecondary">
              {t('f03a.severityLabel')}
            </Text>
            <SeverityBadge
              level={severityTone.tier}
              label={severityTone.label}
              color={severityTone.color}
            />
            <ConfidencePill confidence={content.confidence} />
          </View>
        </View>

        {content.recommendation ? (
          <AiDiagnosisCard title={t('common.recommendedAction')}>
            <DiagnosisNote icon={CheckCircle2}>{content.recommendation}</DiagnosisNote>
          </AiDiagnosisCard>
        ) : null}

        {content.repairSteps.length > 0 ? (
          <AiDiagnosisCard title={t('f03a.whatYouCanDo')}>
            <RepairStepsList steps={content.repairSteps} />
          </AiDiagnosisCard>
        ) : null}

        {/* Last and foldable: worth offering, not worth pushing the repair steps down. */}
        {content.explanation ? (
          // §8.2: collapsed on arrival, overriding the component's own open default.
          <CollapsibleCard title={t('common.whyThisDiagnosis')} defaultOpen={false}>
            <DiagnosisNote icon={Sparkles}>{content.explanation}</DiagnosisNote>
          </CollapsibleCard>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <ReportHeader
        title={isEscalated ? t('f03b.headerTitle') : t('f03a.title')}
        subtitle={isEscalated ? undefined : t('f03a.subtitle')}
        onBack={onBack}
      />

      <View style={styles.body}>{renderBody()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  content: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
    gap: spacing[24],
  },
  // The title and the row under it are one group, tighter than the gap between cards.
  summary: {
    alignItems: 'center',
    gap: spacing[12],
  },
  severity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Wraps: at a large font scale the label, badge and pill do not fit one line.
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[24],
    paddingHorizontal: screenPadding,
  },
});
