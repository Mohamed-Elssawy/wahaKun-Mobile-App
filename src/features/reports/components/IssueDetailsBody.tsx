import { CheckCircle2, ChevronLeft } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ConfidenceRing,
  ProgressRing,
  SeverityBadge,
  Text,
  VoicePlayer,
} from '@/components/ui';
import { CommentComposer } from '@/features/community/components/CommentComposer';
import { CommentThread } from '@/features/community/components/CommentThread';
import { distanceKm } from '@/features/community/distance';
import { hasCoordinates } from '@/features/community/feedQuery';
import { useIssueComments } from '@/features/community/hooks/useIssueComments';
import { useIssueContext } from '@/features/community/hooks/useIssueContext';
import { describeTierDisplay } from '@/features/map/tier';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors, screenPadding, spacing } from '@/theme';

import { farmerSeesAi } from '../aiVisibility';
import { DiagnosisNote } from './DiagnosisNote';
import { IssueIdentityBar } from './IssueIdentityBar';
import { IssueTranscript } from './IssueTranscript';
import { ReportErrorView } from './ReportErrorView';
import { ReportHero } from './ReportHero';
import { ReportStatusTrack } from './ReportStatusTrack';
import { useIssueDetails } from '../hooks/useIssueDetails';
import { ESCALATION_LINE } from '../lifecycle';

const DIAGNOSIS_LABEL = 'تشخيص الذكاء الاصطناعي';
const STATUS_TITLE = 'حالة البلاغ';
const FULL_DIAGNOSIS = 'التشخيص الكامل';
const FULL_TRACKER = 'تتبع البلاغ';
const UNTITLED = 'بلاغ بدون وصف';
const SYMPTOMS_LABEL = 'الأعراض المطابقة';
const ACTION_LABEL = 'الإجراء الموصى به';
const NO_DIAGNOSIS = 'لم يكتمل تحليل الذكاء الاصطناعي بعد.';

const LINK_ICON_SIZE = 18;

export type IssueDetailsBodyProps = {
  reportId: string;
  /** `C-NO-PUBLIC-STEPPER`: off on E-07, which already has the 4-node stepper elsewhere. */
  showPublicStepper: boolean;
  onBack: () => void;
  /** `B-TRACK`'s AI-block link. Visible to any viewer with a diagnosis, owner or not. */
  onOpenDiagnosis: () => void;
  /** `B-TRACK`'s status-section link. Only ever called when `showPublicStepper` and owned. */
  onOpenTracker?: () => void;
};

/** F-04 / E-07's shared body. Reuses F-03a's leaves, not its screen: the two arrange them
 * differently. Role chrome (the stepper, the back target) is the wrapper's job, not this one's. */
export function IssueDetailsBody({
  reportId,
  showPublicStepper,
  onBack,
  onOpenDiagnosis,
  onOpenTracker,
}: IssueDetailsBodyProps) {
  const insets = useSafeAreaInsets();
  const { displayName } = useIdentity();

  // Three hooks, three services. A failure in any one leaves the other two on screen.
  const { report, isOwnReport, error, isLoading, retry } = useIssueDetails(reportId);
  const { issue, origin, share } = useIssueContext(reportId);
  const comments = useIssueComments(reportId);

  // Above the early returns, because a hook cannot be called conditionally. The url is
  // optional and the player no-ops without one.
  const voiceUrl =
    issue?.voiceUrl ?? report?.attachments.find(a => a.type === 'Voice')?.url;
  const voice = useAudioPlayer(voiceUrl);

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

  // T2: the diagnosis, the severity and the confidence are all AI output, so all three go.
  const seesAi = analysis ? farmerSeesAi({ confidence: analysis.confidence }) : false;

  // issue.title is written by the AI too (§3.1), so only the farmer's description survives.
  const aiTitle = seesAi ? analysis?.problemArabic || issue?.title : undefined;
  const title = aiTitle || report.description || UNTITLED;

  const distanceLabel =
    origin && issue && hasCoordinates(issue)
      ? `${distanceKm(origin, issue).toFixed(1)} كم`
      : undefined;

  // B-PUBLIC: open to any viewer, owner or not - unlike the tracker link below.
  const diagnosisLink =
    analysis && seesAi ? (
      <TouchableOpacity
        style={styles.link}
        onPress={onOpenDiagnosis}
        accessibilityRole="link"
        accessibilityLabel={FULL_DIAGNOSIS}
      >
        <Text variant="label16Bold" color="primary">
          {FULL_DIAGNOSIS}
        </Text>
        <ChevronLeft size={LINK_ICON_SIZE} color={colors.primary} />
      </TouchableOpacity>
    ) : null;

  /**
   * F-06 carries scheduling and expert detail that only the farmer who filed the report may
   * read. isOwnReport compares the signed-in account against the reporter and fails closed, so
   * this is hidden for everyone else - and hidden rather than disabled, because a disabled
   * control still tells them the tracker exists. An expert viewer is never the owner, so this
   * never renders on E-07 even before showPublicStepper is checked.
   */
  const trackerLink =
    showPublicStepper && isOwnReport && onOpenTracker ? (
      <TouchableOpacity
        style={styles.link}
        onPress={onOpenTracker}
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
    // Same pattern as the Screen primitive, which F-04 cannot use: its hero is full-bleed.
    // Without it, edge-to-edge stops Android resizing and the composer sits behind the keyboard.
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportHero
          photoUrl={photo?.url}
          title={title}
          severity={seesAi ? analysis?.severity : undefined}
          hasVoice={Boolean(voiceUrl)}
          onBack={onBack}
          onShare={() => share()}
          badge={
            issue && issue.tier !== 'resolved' && seesAi ? (
              <SeverityBadge
                level={issue.tier}
                label={describeTierDisplay(issue.tier).shortLabel}
                color={describeTierDisplay(issue.tier).color}
                style={styles.heroBadge}
              />
            ) : undefined
          }
        />

        <IssueIdentityBar
          reportId={report.id}
          // A report the feed does not list carries no author. When it is this farmer's own,
          // we already know the name, and the placeholder would be telling them they are a
          // stranger.
          authorName={issue?.reporterName ?? (isOwnReport ? displayName : undefined)}
          authorPicture={issue?.reporterPicture}
          createdAt={issue?.createdAt ?? report.createdAt}
          distanceLabel={distanceLabel}
        />

        <View style={styles.body}>
          {/* One section in the frame: the waveform and its transcript sit 16 apart, where
              the gap to the next section is 40. */}
          {voiceUrl || issue?.transcript ? (
            <View style={styles.voiceGroup}>
              {voiceUrl ? (
                <VoicePlayer
                  title="التسجيل الصوتي"
                  isPlaying={voice.isPlaying}
                  progress={voice.progress}
                  onToggle={voice.toggle}
                  errorMessage={voice.hasFailed ? 'تعذر تشغيل التسجيل' : undefined}
                />
              ) : null}
              {issue?.transcript ? (
                <IssueTranscript transcript={issue.transcript} />
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="label16" color="textMuted" align="right">
              {DIAGNOSIS_LABEL}
            </Text>

            {analysis && seesAi ? (
              <>
                <View style={styles.summary}>
                  <Text variant="h4" align="right" style={styles.summaryTitle}>
                    {title}
                  </Text>
                  <ConfidenceRing confidence={analysis.confidence} compact />
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

                {diagnosisLink}
              </>
            ) : (
              <Text variant="body14" color="textSecondary" align="right">
                {analysis ? ESCALATION_LINE : NO_DIAGNOSIS}
              </Text>
            )}
          </View>

          {/* C-NO-PUBLIC-STEPPER: E-07 already has the 4-node expert stepper elsewhere, so the
              3-node public compression would be a third representation on their surface. */}
          {showPublicStepper ? (
            <View style={styles.section}>
              <Text variant="label16" color="textMuted" align="right">
                {STATUS_TITLE}
              </Text>

              <ReportStatusTrack status={report.status} />

              {trackerLink}
            </View>
          ) : null}

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

      {/* Outside the ScrollView: the frame pins it under the thread, not inside it. */}
      <View style={{ paddingBottom: insets.bottom }}>
        <CommentComposer
          canPost={comments.canPost}
          isPosting={comments.isPosting}
          onSubmit={comments.post}
          errorMessage={comments.postError?.message}
        />
      </View>
    </KeyboardAvoidingView>
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
  // Top, not centred, which is where the hero has drawn this badge since the V2 rework.
  heroBadge: {
    alignSelf: 'flex-start',
  },
  body: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
    gap: spacing[40],
  },
  voiceGroup: {
    gap: spacing[16],
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
