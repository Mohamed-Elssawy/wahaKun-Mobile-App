import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  Button,
  ProgressRing,
  ReportSummaryCard,
  Text,
  TextField,
} from '@/components/ui';
import { AiDiagnosisSummary } from '@/features/reports/components/AiDiagnosisSummary';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatReportReference } from '@/features/reports/format';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, roleVariants, screenPadding, spacing } from '@/theme';

import { CaseOverrideSection } from '../../components/CaseOverrideSection';
import { ExpertStepper } from '../../components/ExpertStepper';
import { useCaseReview } from '../../hooks/useCaseReview';

/** E-02, node 3. A fresh AI card, not F-04's, so the farmer surface is left untouched. */
export default function ExpertCaseReviewScreen({
  route,
  navigation,
}: ScreenProps<'ExpertCaseReview'>) {
  const { reportId } = route.params;
  const review = useCaseReview(reportId);

  if (review.isLoading) {
    return (
      <View style={styles.centred}>
        <ProgressRing />
      </View>
    );
  }

  if (review.error || !review.detail) {
    return (
      <View style={styles.screen}>
        <ReportHeader title={t('e02.title')} onBack={navigation.goBack} />
        <View style={styles.body}>
          <ReportErrorView
            error={
              review.error ?? { kind: 'unknown', message: t('errors.case.loadFailed') }
            }
            unknownTitle={t('errors.case.loadFailed')}
            onRetry={review.retry}
          />
        </View>
      </View>
    );
  }

  const { detail } = review;
  const severity = describeSeverity(detail.severity);

  const handleSubmit = async () => {
    const didSubmit = await review.submit();
    if (didSubmit) {
      // Flow G goes straight to E-03. TODO(reschedule): a reopened case belongs on state:reschedule.
      navigation.replace('ExpertSchedule', { reportId });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ReportHeader title={t('e02.title')} onBack={navigation.goBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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

        <ExpertStepper current={1} />

        {/* C71: section header duplicates the card's own label on purpose, matching both E-02 frames per Islam's ruling. */}
        <Text variant={roleVariants.sectionHeader} color="textSecondary">
          {t('common.aiDiagnosis')}
        </Text>

        <AiDiagnosisSummary
          title={detail.title}
          confidence={detail.confidence}
          explanation={detail.explanation}
          recommendation={detail.recommendation}
          onOpenFull={() => navigation.navigate('ExpertDiagnosis', { reportId })}
        />

        <CaseOverrideSection
          isOn={review.isOverrideOn}
          onToggle={review.toggleOverride}
          severity={review.severity}
          onChangeSeverity={review.setSeverity}
          correctedDiagnosis={review.correctedDiagnosis}
          onChangeCorrectedDiagnosis={review.setCorrectedDiagnosis}
        />

        <TextField
          label={t('expert.notesLabel')}
          placeholder={t('expert.notesPlaceholder')}
          value={review.expertNote}
          onChangeText={review.setExpertNote}
          multiline
          numberOfLines={3}
          inputStyle={styles.noteInput}
        />

        {review.submitError ? (
          <ReportErrorView
            error={review.submitError}
            unknownTitle={t('e02.submitErrorTitle')}
            onRetry={handleSubmit}
          />
        ) : null}

        <Button
          label={t('e02.primaryCta')}
          onPress={handleSubmit}
          disabled={!review.canSubmit}
          loading={review.isSubmitting}
          showArrow
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
