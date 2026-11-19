import { Headphones, MessageCircle } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, Text } from '@/components/ui';
import { useIssueComments } from '@/features/community/hooks/useIssueComments';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { farmerSeesAi } from '../../aiVisibility';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHeader } from '../../components/ReportHeader';
import { ReportTimeline } from '../../components/ReportTimeline';
import { formatReportReference } from '../../format';
import { useReportTracker } from '../../hooks/useReportTracker';
import { untitledReport } from '../../lifecycle';
import { formatRelativeTime } from '../../relativeTime';
import { describeSeverity, reportSeverity } from '../../severity';

/** F-06. The owner's single source of truth for one report; renders the canonical 6-node timeline. */
export default function ReportTrackerScreen({
  route,
  navigation,
}: ScreenProps<'ReportTracker'>) {
  const { reportId } = route.params;
  const {
    report,
    view,
    marker,
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
        <ReportHeader title={t('common.trackReport')} onBack={navigation.goBack} />
        <View style={styles.errorBody}>
          <ReportErrorView
            error={error ?? { kind: 'unknown', message: t('f04.loadErrorTitle') }}
            unknownTitle={t('f04.loadErrorTitle')}
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
  // Same chain as F-07's card: a server row has only `title`, never an analysis. See ReportRow.
  const title = aiTitle || report.title || report.description || untitledReport();
  const photo = report.attachments.find(attachment => attachment.type === 'Photo');
  const severity = reportSeverity(report, seesAi);
  const borderColor = severity ? describeSeverity(severity).color : 'borderStrong';

  // F-08 is not built yet; ConnectToExpert is the registered placeholder for escalation paths.
  const contactExpert = () => navigation.navigate('ConnectToExpert', { reportId });

  // F-04 and F-06 pop back to each other when already below, instead of stacking in turns.
  const openComments = () =>
    navigation.navigate('IssueDetails', { reportId }, { pop: true });

  return (
    <View style={styles.screen}>
      <ReportHeader title={t('common.trackReport')} onBack={navigation.goBack} />

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
          marker={marker ?? undefined}
        />

        <View style={styles.timelineCard}>
          <Text variant="label16Bold">{t('f06.title')}</Text>

          <ReportTimeline
            nodes={view}
            onConfirm={confirm}
            onReject={reject}
            isActing={isActing}
          />

          {actionError ? (
            <Text variant="label12" color="error">
              {actionError.message}
            </Text>
          ) : null}
        </View>

        <Button
          label={t('f06.contactExpert')}
          icon={<Headphones size={20} color={colors.textInverse} />}
          onPress={contactExpert}
        />

        <Button
          label={t('f06.viewComments', { total: comments.total })}
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
