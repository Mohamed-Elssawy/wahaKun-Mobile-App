import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, ProgressRing, ReportSummaryCard, Text, TextField } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { CaseDecisionSummary } from '../../components/CaseDecisionSummary';
import { ExpertStepper } from '../../components/ExpertStepper';
import { ScheduleCalendar } from '../../components/ScheduleCalendar';
import { ScheduleSlots } from '../../components/ScheduleSlots';
import { useScheduleRepair } from '../../hooks/useScheduleRepair';

const TITLE = 'جدولة الإصلاح';
const DAY_LABEL = 'يوم الإصلاح';
const NOTE_LABEL = 'ملاحظة للمزارع (اختياري)';
const NOTE_PLACEHOLDER = 'أي تعليمات للمزارع قبل الإصلاح...';
const PRIMARY_LABEL = '✈ تأكيد الجدولة و إشعار المزارع';
const LOAD_ERROR_TITLE = 'تعذر تحميل الحالة';

function slotLabel(date: string): string {
  // "اختر موعداً — الأحد 14 يونيو" needs the chosen day written out; formatRelativeTime
  // doesn't do absolute dates, so this borrows the weekday straight off the Date.
  return new Date(date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** §8.3's E-03, node 4. `Flow G`: reached only from E-02's primary - never from a reschedule. */
export default function ExpertScheduleScreen({
  route,
  navigation,
}: ScreenProps<'ExpertSchedule'>) {
  const { reportId } = route.params;
  const schedule = useScheduleRepair(reportId);

  if (schedule.isLoading) {
    return (
      <View style={styles.centred}>
        <ProgressRing />
      </View>
    );
  }

  if (schedule.error || !schedule.detail) {
    return (
      <View style={styles.screen}>
        <ReportHeader title={TITLE} onBack={navigation.goBack} />
        <View style={styles.body}>
          <ReportErrorView
            error={schedule.error ?? { kind: 'unknown', message: LOAD_ERROR_TITLE }}
            unknownTitle={LOAD_ERROR_TITLE}
            onRetry={schedule.retry}
          />
        </View>
      </View>
    );
  }

  const { detail } = schedule;
  const severity = describeSeverity(detail.severity);

  const handleSubmit = async () => {
    const didSubmit = await schedule.submit();
    if (didSubmit) {
      navigation.replace('ExpertResolutionConfirmation', { reportId });
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

        <ExpertStepper current={2} />

        <View style={styles.dayBlock}>
          <Text variant="label14" color="textSecondary" align="right">
            {DAY_LABEL}
          </Text>
          <ScheduleCalendar
            initialMonth={new Date(detail.createdAt)}
            selectedDate={schedule.selectedDate}
            onSelectDate={schedule.selectDate}
            isDateEnabled={date => schedule.enabledDates.includes(date)}
          />
        </View>

        {schedule.selectedDate ? (
          <ScheduleSlots
            label={`اختر موعداً — ${slotLabel(schedule.selectedDate)}`}
            value={schedule.selectedSlot}
            onChange={schedule.setSelectedSlot}
          />
        ) : null}

        <CaseDecisionSummary
          override={detail.currentOverride}
          onReview={() => navigation.navigate('ExpertCaseReview', { reportId })}
        />

        <TextField
          label={NOTE_LABEL}
          placeholder={NOTE_PLACEHOLDER}
          value={schedule.noteToFarmer}
          onChangeText={schedule.setNoteToFarmer}
          multiline
          numberOfLines={3}
          inputStyle={styles.noteInput}
        />

        {schedule.submitError ? (
          <ReportErrorView
            error={schedule.submitError}
            unknownTitle="تعذر تأكيد الجدولة"
            onRetry={handleSubmit}
          />
        ) : null}

        <Button
          label={PRIMARY_LABEL}
          onPress={handleSubmit}
          disabled={!schedule.canSubmit}
          loading={schedule.isSubmitting}
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
  dayBlock: {
    gap: spacing[8],
  },
  noteInput: {
    textAlign: 'right',
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
