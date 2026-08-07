import { ClipboardList, Clock } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { CaptureNotice } from '../../components/CaptureNotice';
import { ConfidenceGauge } from '../../components/ConfidenceGauge';
import { DiagnosisCard } from '../../components/DiagnosisCard';
import { ProgressRing } from '../../components/ProgressRing';
import { RepairStepsList } from '../../components/RepairStepsList';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHero } from '../../components/ReportHero';
import { SolutionRow } from '../../components/SolutionRow';
import { formatReportReference } from '../../format';
import { useReportDiagnosis } from '../../hooks/useReportDiagnosis';
import { formatRelativeTime } from '../../relativeTime';

const DIAGNOSIS_TITLE = 'تشخيص الذكاء الاصطناعي';
const SOLUTION_TITLE = 'الحل المقترح';
const RECOMMENDATION_LABEL = 'الإجراء الموصى به';
const UNTITLED = 'بلاغ بدون وصف';
const META_ICON_SIZE = 14;

/** F-04. Reuses M7's leaves, not its screen: F-03 and F-04 arrange them differently. */
// Voice, stepper and comments stay unbuilt because no endpoint feeds any of them.
export default function IssueDetailsScreen({
  route,
  navigation,
}: ScreenProps<'IssueDetails'>) {
  const { reportId } = route.params;
  const { report, error, isLoading, retry } = useReportDiagnosis(reportId);

  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ProgressRing />
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.screen}>
        <ReportErrorView
          error={error ?? { kind: 'unknown', message: 'تعذر تحميل البلاغ' }}
          unknownTitle="تعذر تحميل البلاغ"
          onRetry={retry}
        />
      </View>
    );
  }

  const analysis = report.analysis;
  const photo = report.attachments.find(attachment => attachment.type === 'Photo');
  const title = analysis?.problemArabic || report.description || UNTITLED;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ReportHero
          photoUrl={photo?.url}
          title={title}
          severity={analysis?.severity}
          onBack={navigation.goBack}
        />

        <View style={styles.meta}>
          <View style={styles.chip}>
            <Text variant="label12" color="textMuted">
              {formatReportReference(report.id)}
            </Text>
          </View>

          <Clock size={META_ICON_SIZE} color={colors.textMuted} />
          <Text variant="label12" color="textMuted">
            {formatRelativeTime(report.createdAt)}
          </Text>
        </View>

        <View style={styles.body}>
          {analysis ? (
            <>
              <DiagnosisCard title={DIAGNOSIS_TITLE}>
                <View style={styles.summary}>
                  <ConfidenceGauge confidence={analysis.confidence} compact />

                  <Text variant="h4" align="right" style={styles.summaryTitle}>
                    {title}
                  </Text>
                </View>

                {analysis.explanation ? (
                  <Text variant="body14" align="right">
                    {analysis.explanation}
                  </Text>
                ) : null}
              </DiagnosisCard>

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
            </>
          ) : (
            <CaptureNotice
              title="لا يوجد تشخيص لهذا البلاغ"
              message="لم يكتمل تحليل الذكاء الاصطناعي بعد."
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing[32],
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: screenPadding,
    paddingVertical: spacing[16],
  },
  body: {
    paddingHorizontal: screenPadding,
    gap: spacing[24],
  },
  summary: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
  },
  summaryTitle: {
    flex: 1,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii[4],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[2],
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[24],
    paddingHorizontal: screenPadding,
    backgroundColor: colors.background,
  },
});
