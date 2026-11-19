import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { attempt } from '@/features/reports/lifecycle';
import { t } from '@/i18n';

import { windowDates } from '../scheduleWindow';
import { expertApi } from '../services';
import { OTHER_REASON, reasonLabel } from '../types';

import type { ExpertCaseDetail, RescheduleReasonChip, ScheduleSlot } from '../types';

/** E-03. Owns the calendar, slot and note draft, all local, under the same no-drafts rule. */
export function useScheduleRepair(reportId: string) {
  const [detail, setDetail] = useState<ExpertCaseDetail | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [noteToFarmer, setNoteToFarmer] = useState('');
  const [reasonChip, setReasonChip] = useState<RescheduleReasonChip | null>(null);
  const [reasonNote, setReasonNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ReportError | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await expertApi.getCaseDetail(reportId);
      if (isMounted.current) {
        setDetail(result);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(describeError(err, t('errors.case.loadFailed')));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [reportId]);

  useEffect(() => {
    load();
  }, [load]);

  // The same expression T11/T5 use at submit time: a case at Scheduled is always a reschedule.
  const isReschedule = detail?.status === 'Scheduled';

  // C-WINDOW: a first scheduling windows off the filing date, a reschedule off today.
  const enabledDates = useMemo(() => {
    if (!detail) {
      return [];
    }
    return windowDates(
      isReschedule ? new Date(Date.now()).toISOString() : detail.createdAt,
    );
  }, [detail, isReschedule]);

  // Pre-selects the current appointment once, never overwriting a change the expert made.
  useEffect(() => {
    if (!detail?.appointment || detail.status !== 'Scheduled') {
      return;
    }
    const { appointment } = detail;
    setSelectedDate(current => current ?? appointment.date);
    setSelectedSlot(current => current ?? appointment.slot);
  }, [detail]);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  }, []);

  // §8.3: the reason is required only on a reschedule, and `other` needs its free text too.
  // The comparison is against an id now, so no copy edit anywhere can stop it matching.
  const hasReason =
    reasonChip !== null && (reasonChip !== OTHER_REASON || reasonNote.trim().length > 0);

  const canSubmit =
    selectedDate !== null && selectedSlot !== null && (!isReschedule || hasReason);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!canSubmit || !detail || !selectedDate || !selectedSlot || isSubmitting) {
      return false;
    }

    // T11, not T5: a case at Scheduled fails confirmAppointment's from clause.
    const event = detail.status === 'Scheduled' ? 'reschedule' : 'confirmAppointment';

    const result = attempt({ event, actor: 'expert', facts: detail });
    if (!result.ok) {
      // A refusal used to be silent. Same channel as a failed request, which the screen draws.
      setSubmitError(describeError(result.refusal, t('errors.expert.scheduleFailed')));
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await expertApi.confirmAppointment({
        reportId,
        date: selectedDate,
        slot: selectedSlot,
        noteToFarmer: noteToFarmer.trim() || undefined,
        // Resolved to label, not id, since the farmer's chip renders it as plain content; safe only because nothing persists past this session (E4.1) - real fix is server-side, see BACKEND-GAPS #11.
        reason: isReschedule
          ? reasonChip === OTHER_REASON
            ? reasonNote.trim()
            : reasonChip
              ? reasonLabel(reasonChip)
              : undefined
          : undefined,
      });
      return true;
    } catch (err) {
      if (isMounted.current) {
        setSubmitError(describeError(err, t('errors.expert.scheduleFailed')));
      }
      return false;
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  }, [
    canSubmit,
    detail,
    selectedDate,
    selectedSlot,
    isSubmitting,
    reportId,
    noteToFarmer,
    isReschedule,
    reasonChip,
    reasonNote,
  ]);

  return {
    detail,
    error,
    isLoading,
    retry: load,
    isReschedule,
    enabledDates,
    selectedDate,
    selectDate,
    selectedSlot,
    setSelectedSlot,
    noteToFarmer,
    setNoteToFarmer,
    reasonChip,
    setReasonChip,
    reasonNote,
    setReasonNote,
    canSubmit,
    isSubmitting,
    submitError,
    submit,
  };
}
