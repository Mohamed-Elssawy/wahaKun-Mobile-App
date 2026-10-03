import { Headphones, MessageCircle } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, Text } from '@/components/ui';
import { useIssueComments } from '@/features/community/hooks/useIssueComments';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { farmerSeesAi } from '../../aiVisibility';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHeader } from '../../components/ReportHeader';
import { ReportTimeline } from '../../components/ReportTimeline';
import { formatReportReference } from '../../format';
import { useReportTracker } from '../../hooks/useReportTracker';
import { UNTITLED_REPORT } from '../../lifecycle';
import { formatRelativeTime } from '../../relativeTime';
import { describeSeverity } from '../../severity';

const TITLE = 'تتبع البلاغ';
const TIMELINE_CARD_TITLE = 'مسار البلاغ';
const CONTACT_EXPERT = 'التواصل مع الخبير';

/** F-06. The owner's single source of truth for one report; renders the canonical 6-node timeline. */
export default function ReportTrackerScreen({
  route,
  navigation,
}: ScreenProps<'ReportTracker'>) {
  const { reportId } = route.params;
  const {
    report,
    view,
    error,
    isLoading,
    retry,
    confirm,
    reject,
    isActing,
    actionError,
  } = useReportTracker(reportId);
  const comments = useIssueComments(reportId);

  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ProgressRing />
      </View>
    );
  }

  if (error || !report || !view) {
    return (
      <View style={styles.screen}>
        <ReportHeader title={TITLE} onBack={navigation.goBack} />
        <View style={styles.errorBody}>
          <ReportErrorView
            error={error ?? { kind: 'unknown', message: 'تعذر تحميل البلاغ' }}
            unknownTitle="تعذر تحميل البلاغ"
            onRetry={retry}
          />
        </View>
      </View>
    );
  }

  const seesAi = report.analysis
    ? farmerSeesAi({ confidence: report.analysis.confidence })
    : false;
  const aiTitle = seesAi ? report.analysis?.problemArabic : undefined;
  const title = aiTitle || report.description || UNTITLED_REPORT;
  const photo = report.attachments.find(attachment => attachment.type === 'Photo');
  const borderColor =
    seesAi && report.analysis
      ? describeSeverity(report.analysis.severity).color
      : 'borderStrong';

  // F-08 is not built this session; ConnectToExpert is the registered placeholder other
  // escalation paths already use, per Flow G/the F-03b CTA.
  const contactExpert = () => navigation.navigate('ConnectToExpert', { reportId });

  const openComments = () => navigation.navigate('IssueDetails', { reportId });

  return (
    <View style={styles.screen}>
      <ReportHeader title={TITLE} onBack={navigation.goBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ReportSummaryCard
          title={title}
          reference={formatReportReference(report.id)}
          timeLabel={formatRelativeTime(report.createdAt)}
          borderColor={borderColor}
          photoUrl={photo?.url}
        />

        <View style={styles.timelineCard}>
          <Text variant="label16Bold" align="right">
            {TIMELINE_CARD_TITLE}
          </Text>

          <ReportTimeline
            nodes={view}
            onConfirm={confirm}
            onReject={reject}
            isActing={isActing}
          />

          {actionError ? (
            <Text variant="label12" color="error" align="right">
              {actionError.message}
            </Text>
          ) : null}
        </View>

        <Button
          label={CONTACT_EXPERT}
          icon={<Headphones size={20} color={colors.textInverse} />}
          onPress={contactExpert}
        />

        <Button
          label={`عرض التعليقات (${comments.total})`}
          variant="secondary"
          icon={<MessageCircle size={20} color={colors.primary} />}
          onPress={openComments}
        />
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
    padding: screenPadding,
    gap: spacing[16],
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radii[12],
    padding: spacing[16],
    gap: spacing[16],
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
  },
});
