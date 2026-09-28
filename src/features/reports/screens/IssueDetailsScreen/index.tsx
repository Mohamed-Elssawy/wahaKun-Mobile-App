import { CheckCircle2, ChevronLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { CommentComposer } from '@/features/community/components/CommentComposer';
import { CommentThread } from '@/features/community/components/CommentThread';
import { TierBadge } from '@/features/community/components/TierBadge';
import { distanceKm } from '@/features/community/distance';
import { hasCoordinates } from '@/features/community/feedQuery';
import { useIssueComments } from '@/features/community/hooks/useIssueComments';
import { useIssueContext } from '@/features/community/hooks/useIssueContext';
import { describeTierDisplay } from '@/features/map/tier';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { ConfidenceGauge } from '../../components/ConfidenceGauge';
import { DiagnosisNote } from '../../components/DiagnosisNote';
import { IssueIdentityBar } from '../../components/IssueIdentityBar';
import { IssueTranscript } from '../../components/IssueTranscript';
import { ProgressRing } from '../../components/ProgressRing';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHero } from '../../components/ReportHero';
import { ReportStatusTrack } from '../../components/ReportStatusTrack';
import { VoicePlayerCard } from '../../components/VoicePlayerCard';
import { useIssueDetails } from '../../hooks/useIssueDetails';

const DIAGNOSIS_LABEL = 'تشخيص الذكاء الاصطناعي';
const STATUS_TITLE = 'حالة البلاغ';
const FULL_TRACKER = 'تتبع كامل';
const UNTITLED = 'بلاغ بدون وصف';
const SYMPTOMS_LABEL = 'الأعراض المطابقة';
const ACTION_LABEL = 'الإجراء الموصى به';
const NO_DIAGNOSIS = 'لم يكتمل تحليل الذكاء الاصطناعي بعد.';

const LINK_ICON_SIZE = 18;

/** F-04. Reuses F-03a's leaves, not its screen: the two arrange them differently. */
export default function IssueDetailsScreen({
  route,
  navigation,
}: ScreenProps<'IssueDetails'>) {
  const { reportId } = route.params;
  const insets = useSafeAreaInsets();

  // Three hooks, three services. A failure in any one leaves the other two on screen.
  const { report, isOwnReport, error, isLoading, retry } = useIssueDetails(reportId);
  const { issue, origin, share } = useIssueContext(reportId);
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
  const voiceUrl =
    issue?.voiceUrl ?? report.attachments.find(a => a.type === 'Voice')?.url;
  const title = analysis?.problemArabic || issue?.title || report.description || UNTITLED;

  const distanceLabel =
    origin && issue && hasCoordinates(issue)
      ? `${distanceKm(origin, issue).toFixed(1)} كم`
      : undefined;

  /**
   * F-06 is the issue tracker, and it carries scheduling and expert detail that only the
   * farmer who filed the report may read. isOwnReport compares the signed-in account against
   * the reporter and fails closed, so this is hidden for everyone else - and hidden rather
   * than disabled, because a disabled control still tells them the tracker exists.
   */
  // F-06 is not built yet, so the link opens the full diagnosis, which is the closest screen
  // the farmer already owns. Point it at IssueTracker when that route lands.
  const openTracker = () => navigation.navigate('ReportDiagnosis', { reportId });

  const trackerLink = isOwnReport ? (
    <TouchableOpacity
      style={styles.link}
      onPress={openTracker}
      accessibilityRole="link"
      accessibilityLabel={FULL_TRACKER}
    >
      <Text variant="label16Bold" color="primary">
        {FULL_TRACKER}
      </Text>
      <ChevronLeft size={LINK_ICON_SIZE} color={colors.primary} />
    </TouchableOpacity>
  ) : null;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportHero
          photoUrl={photo?.url}
          title={title}
          severity={analysis?.severity}
          hasVoice={Boolean(voiceUrl)}
          onBack={navigation.goBack}
          onShare={() => share()}
          badge={
            issue && issue.tier !== 'resolved' ? (
              <TierBadge
                tier={issue.tier}
                label={describeTierDisplay(issue.tier).shortLabel}
              />
            ) : undefined
          }
        />

        <IssueIdentityBar
          reportId={report.id}
          authorName={issue?.reporterName}
          authorPicture={issue?.reporterPicture}
          createdAt={issue?.createdAt ?? report.createdAt}
          distanceLabel={distanceLabel}
        />

        <View style={styles.body}>
          {voiceUrl ? <VoicePlayerCard voiceUrl={voiceUrl} /> : null}

          {issue?.transcript ? <IssueTranscript transcript={issue.transcript} /> : null}

          <View style={styles.section}>
            <Text variant="label16" color="textMuted" align="right">
              {DIAGNOSIS_LABEL}
            </Text>

            {analysis ? (
              <>
                <View style={styles.summary}>
                  <Text variant="h4" align="right" style={styles.summaryTitle}>
                    {title}
                  </Text>
                  <ConfidenceGauge confidence={analysis.confidence} compact />
                </View>

                {/* A summary: all seven repair steps here buried the status track. */}
                {analysis.explanation ? (
                  <DiagnosisNote icon={CheckCircle2} label={SYMPTOMS_LABEL}>
                    {analysis.explanation}
                  </DiagnosisNote>
                ) : null}

                {analysis.recommendation ? (
                  <DiagnosisNote icon={CheckCircle2} label={ACTION_LABEL}>
                    {analysis.recommendation}
                  </DiagnosisNote>
                ) : null}

                {trackerLink}
              </>
            ) : (
              <Text variant="body14" color="textSecondary" align="right">
                {NO_DIAGNOSIS}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text variant="label16" color="textMuted" align="right">
              {STATUS_TITLE}
            </Text>

            <ReportStatusTrack status={report.status} />

            {trackerLink}
          </View>

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

      {/* Outside the ScrollView: the frame pins it above the tab bar, not under the thread. */}
      <View style={{ paddingBottom: insets.bottom }}>
        <CommentComposer
          canPost={comments.canPost}
          isPosting={comments.isPosting}
          onSubmit={comments.post}
          errorMessage={comments.postError?.message}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // surface, not background: F-04's body is a full-bleed white sheet under the hero.
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: spacing[32],
  },
  body: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
    gap: spacing[32],
  },
  section: {
    gap: spacing[12],
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
    // Its own 48dp target: it sits in a section with no other padding to borrow.
    minHeight: 48,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[24],
    paddingHorizontal: screenPadding,
    backgroundColor: colors.surface,
  },
});
