import { CheckCircle2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { CaseResolutionSummaryCard } from '../../components/CaseResolutionSummaryCard';
import { ExpertStepper } from '../../components/ExpertStepper';
import { useExpertCaseDetail } from '../../hooks/useExpertCaseDetail';

const TITLE = 'تم إغلاق الحالة';
const SUBTITLE = 'وافق المزارع على الحل، وتم إغلاق الحالة بنجاح.';
const SUMMARY_TITLE = 'ملخص الإصلاح';
const PRIMARY_LABEL = 'العودة للوارد ←';
const LOAD_ERROR_TITLE = 'تعذر تحميل الحالة';
const CIRCLE_SIZE = 72;
const ICON_SIZE = 32;

/** §8.3's E-06. `تم الحل` is terminal (`S-TERMINAL`) - reached only because the farmer
 * confirmed from F-06, never because the expert did anything. */
export default function ExpertCaseClosedScreen({
  route,
  navigation,
}: ScreenProps<'ExpertCaseClosed'>) {
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
          borderColor="success"
          photoUrl={detail.photoUrl}
        />

        {/* E-06 is closed: all four nodes are complete, not node 4 "current". */}
        <ExpertStepper current={5} />

        <View style={styles.hero}>
          <View style={styles.circle}>
            <CheckCircle2 size={ICON_SIZE} color={colors.successText} />
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
    backgroundColor: colors.successTint,
  },
});
