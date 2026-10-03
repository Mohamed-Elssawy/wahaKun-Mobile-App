import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, TextField } from '@/components/ui';
import { AiDiagnosisSummary } from '@/features/reports/components/AiDiagnosisSummary';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { CaseOverrideSection } from '../../components/CaseOverrideSection';
import { ExpertStepper } from '../../components/ExpertStepper';
import { useCaseReview } from '../../hooks/useCaseReview';

const TITLE = 'مراجعة الحالة';
const NOTE_LABEL = 'ملاحظات الخبير';
const NOTE_PLACEHOLDER = 'أي ملاحظة تريد نشرها للمزارع...';
const PRIMARY_LABEL = 'الخطوة التالية — تحديد موعد الإصلاح';
const LOAD_ERROR_TITLE = 'تعذر تحميل الحالة';

/**
 * §8.3's E-02, node 3. The AI card is new, not F-04's: this branch leaves the farmer surface
 * untouched, so `AiDiagnosisSummary` is a fresh component built from the same leaves.
 */
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
        <ReportHeader title={TITLE} onBack={navigation.goBack} />
        <View style={styles.body}>
          <ReportErrorView
            error={review.error ?? { kind: 'unknown', message: LOAD_ERROR_TITLE }}
            unknownTitle={LOAD_ERROR_TITLE}
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
      // Flow G: E-02's primary goes straight to E-03, never back - there is nothing to confirm.
      // TODO(reschedule): a reopened case should land on `E-03 · state:reschedule`, not this
      // screen - out of scope this session, and the mock's own status flip makes this a no-op.
      navigation.replace('ExpertSchedule', { reportId });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ReportHeader title={TITLE} onBack={navigation.goBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ReportSummaryCard
          title={detail.title}
          reference={`#${detail.reportId}`}
          timeLabel={formatRelativeTime(detail.createdAt)}
          borderColor={severity.color}
          photoUrl={detail.photoUrl}
        />

        <ExpertStepper current={1} />

        <AiDiagnosisSummary
          title={detail.title}
          confidence={detail.confidence}
          explanation={detail.explanation}
          recommendation={detail.recommendation}
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
          label={NOTE_LABEL}
          placeholder={NOTE_PLACEHOLDER}
          value={review.expertNote}
          onChangeText={review.setExpertNote}
          multiline
          numberOfLines={3}
          inputStyle={styles.noteInput}
        />

        {review.submitError ? (
          <ReportErrorView
            error={review.submitError}
            unknownTitle="تعذر إرسال المراجعة"
            onRetry={handleSubmit}
          />
        ) : null}

        <Button
          label={PRIMARY_LABEL}
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
    textAlign: 'right',
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
