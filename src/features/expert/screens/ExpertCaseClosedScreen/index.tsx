import { CheckCircle2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatReportReference } from '@/features/reports/format';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { CaseResolutionSummaryCard } from '../../components/CaseResolutionSummaryCard';
import { ExpertStepper } from '../../components/ExpertStepper';
import { useExpertCaseDetail } from '../../hooks/useExpertCaseDetail';

const CIRCLE_SIZE = 100;
const ICON_SIZE = 56;

/** E-06. تم الحل is terminal, and reached only because the farmer confirmed from F-06. */
export default function ExpertCaseClosedScreen({
  route,
  navigation,
}: ScreenProps<'ExpertCaseClosed'>) {
  const { reportId } = route.params;
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
        <ReportHeader title={t('e06.title')} onBack={goToInbox} />
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

  return (
    <View style={styles.screen}>
      <ReportHeader title={t('e06.title')} onBack={goToInbox} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* C71/SPEC 376: trailing chevron opens E-07's full report, an edge SPEC 232's chain omits, added per Islam's ruling in E10. */}
        <ReportSummaryCard
          title={detail.title}
          reference={formatReportReference(detail.reportId)}
          timeLabel={formatRelativeTime(detail.createdAt)}
          borderColor="success"
          photoUrl={detail.photoUrl}
          onPress={() => navigation.navigate('ExpertIssueDetails', { reportId })}
        />

        {/* E-06 is closed: all four nodes are complete, not node 4 "current". */}
        <ExpertStepper current={5} />

        <View style={styles.hero}>
          <View style={styles.circle}>
            <CheckCircle2 size={ICON_SIZE} color={colors.primaryPressed} />
          </View>
          <Text variant="h4" align="center">
            {t('e06.title')}
          </Text>
          <Text variant="body14" color="textSecondary" align="center">
            {t('e06.subtitle')}
          </Text>
        </View>

        {detail.repair ? (
          <CaseResolutionSummaryCard
            title={t('e06.summaryTitle')}
            photoUrl={detail.repair.photoUrl}
            notes={detail.repair.notes}
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
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
});
