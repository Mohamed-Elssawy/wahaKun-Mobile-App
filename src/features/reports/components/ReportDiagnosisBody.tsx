import { CheckCircle2, Sparkles } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AiDiagnosisCard,
  ConfidencePill,
  ProgressRing,
  SeverityBadge,
  Text,
} from '@/components/ui';
import { colors, screenPadding, spacing } from '@/theme';

import { farmerSeesAi } from '../aiVisibility';
import { CaptureNotice } from './CaptureNotice';
import { CollapsibleCard } from './CollapsibleCard';
import { DiagnosisNote } from './DiagnosisNote';
import { RepairStepsList } from './RepairStepsList';
import { ReportErrorView } from './ReportErrorView';
import { ReportHeader } from './ReportHeader';
import { useReportDiagnosis } from '../hooks/useReportDiagnosis';
import { ESCALATION_LINE, ESCALATION_TITLE } from '../lifecycle';
import { describeSeverity } from '../severity';

const RECOMMENDATION_TITLE = 'الإجراء الموصى به';
const STEPS_TITLE = 'ما يمكنك فعله الآن';
const EXPLANATION_TITLE = 'لماذا هذا التشخيص؟';
const SEVERITY_LABEL = 'مستوى الخطورة:';
const UNTITLED_PROBLEM = 'مشكلة غير محددة';

export type ReportDiagnosisBodyProps = {
  reportId: string;
  onBack: () => void;
};

/**
 * F-03a / E-11's shared body. §8.3's delta table: the expert sees exactly what the farmer
 * sees, including `ما يمكنك فعله الآن` - chrome (header title, tab bar, back target) is the
 * wrapper's job. No footer in the frame, so back is the only way out and nothing is confirmed.
 */
// The frame's symptom and cost lines have no endpoint, so they are left out.
export function ReportDiagnosisBody({ reportId, onBack }: ReportDiagnosisBodyProps) {
  const { report, error, isLoading, retry } = useReportDiagnosis(reportId);

  const analysis = report?.analysis;

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
          unknownTitle="تعذر تحميل التشخيص"
          onRetry={retry}
        />
      );
    }

    // A report can exist without analysis, and this screen has nothing to say then.
    if (!analysis) {
      return (
        <CaptureNotice
          title="لا يوجد تشخيص لهذا البلاغ"
          message="لم يكتمل تحليل الذكاء الاصطناعي بعد."
        />
      );
    }

    // T2: below the threshold, or on a transcription failure, the farmer sees none of this.
    // F-03b is the screen that belongs here; until it is built, the canonical line stands in.
    if (!farmerSeesAi({ confidence: analysis.confidence })) {
      return <CaptureNotice title={ESCALATION_TITLE} message={ESCALATION_LINE} />;
    }

    const severityTone = describeSeverity(analysis.severity);

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* The problem is the headline; confidence is a footnote in the row below. */}
        <View style={styles.summary}>
          <Text variant="h3" align="center">
            {analysis.problemArabic || analysis.problemName || UNTITLED_PROBLEM}
          </Text>

          <View style={styles.severity}>
            <Text variant="body14" color="textSecondary">
              {SEVERITY_LABEL}
            </Text>
            <SeverityBadge
              level={severityTone.tier}
              label={severityTone.label}
              color={severityTone.color}
            />
            <ConfidencePill confidence={analysis.confidence} />
          </View>
        </View>

        {analysis.recommendation ? (
          <AiDiagnosisCard title={RECOMMENDATION_TITLE}>
            <DiagnosisNote icon={CheckCircle2}>{analysis.recommendation}</DiagnosisNote>
          </AiDiagnosisCard>
        ) : null}

        {analysis.repairSteps.length > 0 ? (
          <AiDiagnosisCard title={STEPS_TITLE}>
            <RepairStepsList steps={analysis.repairSteps} />
          </AiDiagnosisCard>
        ) : null}

        {/* Last and foldable: worth offering, not worth pushing the repair steps down. */}
        {analysis.explanation ? (
          <CollapsibleCard title={EXPLANATION_TITLE}>
            <DiagnosisNote icon={Sparkles}>{analysis.explanation}</DiagnosisNote>
          </CollapsibleCard>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <ReportHeader
        title="نتيجة التشخيص"
        subtitle="تحليل الذكاء الاصطناعي للمشكلة"
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
    flexDirection: 'row-reverse',
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
