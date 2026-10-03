import { Hourglass } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { CaseResolutionSummaryCard } from '../../components/CaseResolutionSummaryCard';
import { ExpertStepper } from '../../components/ExpertStepper';
import { useExpertCaseDetail } from '../../hooks/useExpertCaseDetail';

const TITLE = 'بإنتظار موافقة المزارع';
const SUBTITLE = 'تم إرسال تأكيد الإصلاح إلى المزارع. سيتم إغلاق الحالة تلقائياً بعد موافقته.';
const SUMMARY_TITLE = 'ملخص ما تم إرساله للمزارع';
const PRIMARY_LABEL = 'العودة للوارد ←';
const LOAD_ERROR_TITLE = 'تعذر تحميل الحالة';
const CIRCLE_SIZE = 72;
const ICON_SIZE = 32;

/**
 * §8.3's E-05, node 6. A snapshot taken once at entry, never live: a farmer rejection while the
 * expert sits here produces no update - that only shows up back on E-01 as `has-reopened`.
 */
export default function ExpertAwaitingApprovalScreen({
  route,
  navigation,
}: ScreenProps<'ExpertAwaitingApproval'>) {
  const { reportId } = route.params;
  const { detail, error, isLoading, retry } = useExpertCaseDetail(reportId);

  const goToInbox = () => navigation.navigate('ExpertHome', { screen: 'ExpertInbox' });

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
        <ReportHeader title={TITLE} />
        <View style={styles.body}>
          <ReportErrorView
            error={error ?? { kind: 'unknown', message: LOAD_ERROR_TITLE }}
            unknownTitle={LOAD_ERROR_TITLE}
            onRetry={retry}
          />
        </View>
      </View>
    );
  }

  const severity = describeSeverity(detail.severity);

  return (
    <View style={styles.screen}>
      <ReportHeader title={TITLE} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ReportSummaryCard
          title={detail.title}
          reference={`#${detail.reportId}`}
          timeLabel={formatRelativeTime(detail.createdAt)}
          borderColor={severity.color}
          photoUrl={detail.photoUrl}
        />

        <ExpertStepper current={4} />

        <View style={styles.hero}>
          <View style={styles.circle}>
            <Hourglass size={ICON_SIZE} color={colors.primaryPressed} />
          </View>
          <Text variant="h1" align="center">
            {TITLE}
          </Text>
          <Text variant="label14" color="textSecondary" align="center">
            {SUBTITLE}
          </Text>
        </View>

        {detail.repair ? (
          <CaseResolutionSummaryCard
            title={SUMMARY_TITLE}
            photoUrl={detail.repair.photoUrl}
            notes={detail.repair.notes}
          />
        ) : null}

        <Button label={PRIMARY_LABEL} onPress={goToInbox} />
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
    gap: spacing[12],
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
