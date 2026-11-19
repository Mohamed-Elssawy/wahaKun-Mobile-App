import { Hourglass } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatReportReference } from '@/features/reports/format';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { CaseResolutionSummaryCard } from '../../components/CaseResolutionSummaryCard';
import { ExpertStepper } from '../../components/ExpertStepper';
import { useExpertCaseDetail } from '../../hooks/useExpertCaseDetail';

const CIRCLE_SIZE = 100;
const ICON_SIZE = 56;

/** E-05, node 6. A snapshot at entry: a farmer rejection here shows up only back on E-01. */
export default function ExpertAwaitingApprovalScreen({
  route,
  navigation,
}: ScreenProps<'ExpertAwaitingApproval'>) {
  const { reportId, submitted } = route.params;
  const { detail, error, isLoading, retry } = useExpertCaseDetail(reportId);

  // "Back to inbox" goes BACK: a navigate would push a second ExpertHome over the case screens.
  const goToInbox = () => navigation.popTo('ExpertHome', { screen: 'ExpertInbox' });

  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ProgressRing />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.screen}>
        <ReportHeader title={t('e05.title')} onBack={goToInbox} />
        <View style={styles.body}>
          <ReportErrorView
            error={error ?? { kind: 'unknown', message: t('errors.case.loadFailed') }}
            unknownTitle={t('errors.case.loadFailed')}
            onRetry={retry}
          />
        </View>
      </View>
    );
  }

  const severity = describeSeverity(detail.severity);

  // The read first, so a server that starts answering supersedes the carried-forward write.
  const repair =
    detail.repair ??
    (submitted ? { notes: submitted.notes, photoUrl: submitted.photoUri } : undefined);

  return (
    <View style={styles.screen}>
      <ReportHeader title={t('e05.title')} onBack={goToInbox} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* C71/SPEC 376: trailing chevron opens E-07's full report, an edge SPEC 232's chain omits, added per Islam's ruling in E10. */}
        <ReportSummaryCard
          title={detail.title}
          reference={formatReportReference(detail.reportId)}
          timeLabel={formatRelativeTime(detail.createdAt)}
          borderColor={severity.color}
          photoUrl={detail.photoUrl}
          onPress={() => navigation.navigate('ExpertIssueDetails', { reportId })}
        />

        <ExpertStepper current={4} />

        <View style={styles.hero}>
          <View style={styles.circle}>
            <Hourglass size={ICON_SIZE} color={colors.primaryPressed} />
          </View>
          <Text variant="h4" align="center">
            {t('e05.title')}
          </Text>
          <Text
            variant="body14"
            color="textSecondary"
            align="center"
            style={styles.heroSubtitle}
          >
            {t('e05.subtitle')}
          </Text>
        </View>

        {/* §8.3 needs this card but detail.repair never carries notes back (BACKEND-GAP G9), so `submitted` carries E-04's write forward as the only copy on this device. */}
        {repair ? (
          <CaseResolutionSummaryCard
            title={t('e05.summaryTitle')}
            photoUrl={repair.photoUrl}
            notes={repair.notes}
          />
        ) : null}

        {/* C75/G-02: backward arrow (S-05.6b precedent) since this returns to E-01; the glyph already flips with locale. */}
        <Button label={t('expert.backToInbox')} showArrowEnd onPress={goToInbox} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  hero: {
    alignItems: 'center',
    gap: spacing[8],
    paddingVertical: spacing[16],
  },
  heroSubtitle: {
    maxWidth: 310,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
});
