import { ClipboardList } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { CaptureNotice } from '../../components/CaptureNotice';
import { ConfidenceGauge } from '../../components/ConfidenceGauge';
import { DiagnosisCard } from '../../components/DiagnosisCard';
import { ProgressRing } from '../../components/ProgressRing';
import { RepairStepsList } from '../../components/RepairStepsList';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHeader } from '../../components/ReportHeader';
import { SeverityBadge } from '../../components/SeverityBadge';
import { SolutionRow } from '../../components/SolutionRow';
import { useReportDiagnosis } from '../../hooks/useReportDiagnosis';

const EVIDENCE_TITLE = 'الأعراض المطابقة';
const SOLUTION_TITLE = 'الحل المقترح';
const RECOMMENDATION_LABEL = 'الإجراء الموصى به';
const SEVERITY_LABEL = 'مستوى الخطورة:';
const UNTITLED_PROBLEM = 'مشكلة غير محددة';

/** F-03. No footer in the frame, so back is the only way out and nothing is confirmed. */
// The design's symptom and cost fields do not exist, so each card shows the nearest real one.
export default function ReportDiagnosisScreen({
  route,
  navigation,
}: ScreenProps<'ReportDiagnosis'>) {
  const { reportId } = route.params;
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

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ConfidenceGauge confidence={analysis.confidence} />

        <View style={styles.summary}>
          <Text variant="h4" align="center">
            {analysis.problemArabic || analysis.problemName || UNTITLED_PROBLEM}
          </Text>

          <View style={styles.severity}>
            <Text variant="label12" color="textMuted">
              {SEVERITY_LABEL}
            </Text>
            <SeverityBadge severity={analysis.severity} />
          </View>
        </View>

        {analysis.explanation ? (
          <DiagnosisCard title={EVIDENCE_TITLE}>
            <Text variant="body14" align="right">
              {analysis.explanation}
            </Text>
          </DiagnosisCard>
        ) : null}

        {analysis.recommendation || analysis.repairSteps.length > 0 ? (
          <DiagnosisCard title={SOLUTION_TITLE}>
            {analysis.recommendation ? (
              <SolutionRow
                icon={ClipboardList}
                label={RECOMMENDATION_LABEL}
                value={analysis.recommendation}
              />
            ) : null}

            {analysis.repairSteps.length > 0 ? (
              <RepairStepsList steps={analysis.repairSteps} />
            ) : null}
          </DiagnosisCard>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <ReportHeader
        title="نتيجة التشخيص"
        subtitle="تحليل الذكاء الاصطناعي للمشكلة"
        onBack={navigation.goBack}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  // The gauge and its two lines are one group, tighter than the gap between cards.
  summary: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  severity: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: screenPadding,
  },
});
