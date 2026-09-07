import { CheckCircle2, ChevronLeft, Clock } from 'lucide-react-native';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { CommentThread } from '@/features/community/components/CommentThread';
import { useIssueComments } from '@/features/community/hooks/useIssueComments';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { CaptureNotice } from '../../components/CaptureNotice';
import { ConfidenceGauge } from '../../components/ConfidenceGauge';
import { DiagnosisCard } from '../../components/DiagnosisCard';
import { DiagnosisNote } from '../../components/DiagnosisNote';
import { ProgressRing } from '../../components/ProgressRing';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHero } from '../../components/ReportHero';
import { ReportStatusTrack } from '../../components/ReportStatusTrack';
import { formatReportReference } from '../../format';
import { useIssueDetails } from '../../hooks/useIssueDetails';
import { formatRelativeTime } from '../../relativeTime';

const DIAGNOSIS_TITLE = 'تشخيص الذكاء الاصطناعي';
const STATUS_TITLE = 'حالة البلاغ';
const FULL_DIAGNOSIS = 'تتبع كامل';
const UNTITLED = 'بلاغ بدون وصف';
const META_ICON_SIZE = 14;
const LINK_ICON_SIZE = 18;

/** F-04. Reuses F-03a's leaves, not its screen: the two arrange them differently. */
// The frame's voice player, reporter, distance and comments have no endpoint.
export default function IssueDetailsScreen({
  route,
  navigation,
}: ScreenProps<'IssueDetails'>) {
  const { reportId } = route.params;
  const { report, isOwnReport, error, isLoading, retry } = useIssueDetails(reportId);
  const comments = useIssueComments(reportId);

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
            <Text variant="label12" color="textSecondary">
              {formatReportReference(report.id)}
            </Text>
          </View>

          <Clock size={META_ICON_SIZE} color={colors.textSecondary} />
          <Text variant="label12" color="textSecondary">
            {formatRelativeTime(report.createdAt)}
          </Text>
        </View>

        <View style={styles.body}>
          {analysis ? (
            <DiagnosisCard title={DIAGNOSIS_TITLE}>
              <View style={styles.summary}>
                <Text variant="h4" align="right" style={styles.summaryTitle}>
                  {title}
                </Text>
                <ConfidenceGauge confidence={analysis.confidence} compact />
              </View>

              {/* A summary: all seven repair steps here buried the status track. */}
              {analysis.explanation ? (
                <DiagnosisNote icon={CheckCircle2}>{analysis.explanation}</DiagnosisNote>
              ) : null}

              {analysis.recommendation ? (
                <DiagnosisNote icon={CheckCircle2}>
                  {analysis.recommendation}
                </DiagnosisNote>
              ) : null}

              {/* Only this device's reports have a full diagnosis screen to open. */}
              {isOwnReport ? (
                <TouchableOpacity
                  style={styles.link}
                  onPress={() => navigation.navigate('ReportDiagnosis', { reportId })}
                  accessibilityRole="link"
                  accessibilityLabel={FULL_DIAGNOSIS}
                >
                  <Text variant="label14Bold" color="primary">
                    {FULL_DIAGNOSIS}
                  </Text>
                  <ChevronLeft size={LINK_ICON_SIZE} color={colors.primary} />
                </TouchableOpacity>
              ) : null}
            </DiagnosisCard>
          ) : (
            <CaptureNotice
              title="لا يوجد تشخيص لهذا البلاغ"
              message="لم يكتمل تحليل الذكاء الاصطناعي بعد."
            />
          )}

          <DiagnosisCard title={STATUS_TITLE}>
            <ReportStatusTrack status={report.status} />
          </DiagnosisCard>

          <CommentThread
            comments={comments.comments}
            total={comments.total}
            hasMore={comments.hasMore}
            isLoading={comments.isLoading}
            isLoadingMore={comments.isLoadingMore}
            hasError={comments.error !== null}
            onLoadMore={comments.loadMore}
            onRetry={comments.retry}
          />
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
  // Trailing edge in an RTL layout, matching where the frame puts it.
  link: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[4],
    // Its own 48dp target: it sits inside a card with no other padding to borrow.
    minHeight: 48,
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
