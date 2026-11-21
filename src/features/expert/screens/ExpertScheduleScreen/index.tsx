import { Clock, Send } from 'lucide-react-native';
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
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { formatReportReference } from '@/features/reports/format';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { describeSeverity } from '@/features/reports/severity';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { CaseDecisionSummary } from '../../components/CaseDecisionSummary';
import { ExpertStepper } from '../../components/ExpertStepper';
import { ScheduleCalendar } from '../../components/ScheduleCalendar';
import { ScheduleReasonChips } from '../../components/ScheduleReasonChips';
import { ScheduleSlots } from '../../components/ScheduleSlots';
import { useScheduleRepair } from '../../hooks/useScheduleRepair';
import { formatSlotDay } from '../../scheduleWindow';
import { slotLabel } from '../../types';

/** Matches C45's secondary glyphs, which are the only other icons inside a Button. */
const CTA_ICON = 20;

/** E-03, node 4/5. schedule.isReschedule tells a reschedule from a first scheduling. */
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
        <ReportHeader title={t('expert.scheduleRepair')} onBack={navigation.goBack} />
        <View style={styles.body}>
          <ReportErrorView
            error={
              schedule.error ?? { kind: 'unknown', message: t('errors.case.loadFailed') }
            }
            unknownTitle={t('errors.case.loadFailed')}
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
      <ReportHeader title={t('expert.scheduleRepair')} onBack={navigation.goBack} />

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

        <ExpertStepper current={2} />

        {schedule.isReschedule && detail.appointment ? (
          <View style={styles.currentAppointment}>
            <Clock size={16} color={colors.primary} />
            <Text
              variant="label14"
              color="primaryPressed"
              style={styles.currentAppointmentText}
            >
              {`${t('e03.currentAppointment')}: ${formatSlotDay(detail.appointment.date)} — ${slotLabel(detail.appointment.slot)}`}
            </Text>
          </View>
        ) : null}

        <View style={styles.dayBlock}>
          <Text variant="h5" color="textSecondary">
            {t('e03.dayLabel')}
          </Text>
          <ScheduleCalendar
            initialMonth={
              new Date(
                schedule.isReschedule
                  ? (detail.appointment?.date ?? Date.now())
                  : detail.createdAt,
              )
            }
            selectedDate={schedule.selectedDate}
            onSelectDate={schedule.selectDate}
            isDateEnabled={date => schedule.enabledDates.includes(date)}
          />
        </View>

        {schedule.selectedDate ? (
          <ScheduleSlots
            label={t('e03.slotHeading', {
              selectedDate: formatSlotDay(schedule.selectedDate),
            })}
            value={schedule.selectedSlot}
            onChange={schedule.setSelectedSlot}
          />
        ) : null}

        {schedule.isReschedule ? (
          <ScheduleReasonChips
            value={schedule.reasonChip}
            onChange={schedule.setReasonChip}
            note={schedule.reasonNote}
            onNoteChange={schedule.setReasonNote}
          />
        ) : null}

        <CaseDecisionSummary
          override={detail.currentOverride}
          onReview={() => navigation.navigate('ExpertCaseReview', { reportId })}
        />

        <TextField
          label={t('expert.noteToFarmer')}
          placeholder={t('expert.noteToFarmerPlaceholder')}
          value={schedule.noteToFarmer}
          onChangeText={schedule.setNoteToFarmer}
          multiline
          numberOfLines={3}
          inputStyle={styles.noteInput}
        />

        {schedule.submitError ? (
          <ReportErrorView
            error={schedule.submitError}
            unknownTitle={t('e03.confirmErrorTitle')}
            onRetry={handleSubmit}
          />
        ) : null}

        {/* C74: paper-plane icon trails, matching E-02's arrow and the original Arabic frames for E-03/E-04. */}
        <Button
          label={
            schedule.isReschedule ? t('e03.reschedulePrimaryCta') : t('e03.primaryCta')
          }
          icon={<Send size={CTA_ICON} color={colors.textInverse} />}
          iconTrails
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
  currentAppointment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[12],
    borderRadius: radii[12],
    backgroundColor: colors.primaryTint,
  },
  currentAppointmentText: {
    flex: 1,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
