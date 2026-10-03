import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { attempt } from '@/features/reports/lifecycle';

import { windowDates } from '../scheduleWindow';
import { expertApi } from '../services';

import type { ExpertCaseDetail, ScheduleSlot } from '../types';

const LOAD_ERROR = 'تعذر تحميل الحالة';
const SUBMIT_ERROR = 'تعذر تأكيد الجدولة، حاول مرة أخرى';

/**
 * §8.3's E-03. Loads the case once for the report card and the `قرار الخبير` summary, and owns
 * the calendar/slot/note draft - all local, same "no drafts" rule `useCaseReview` follows.
 */
export function useScheduleRepair(reportId: string) {
  const [detail, setDetail] = useState<ExpertCaseDetail | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [noteToFarmer, setNoteToFarmer] = useState('');

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
        setError(describeError(err, LOAD_ERROR));
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

  // C-WINDOW: the 7 days from the filing date, computed once the case is loaded.
  const enabledDates = useMemo(
    () => (detail ? windowDates(detail.createdAt) : []),
    [detail],
  );

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  }, []);

  const canSubmit = selectedDate !== null && selectedSlot !== null;

  const submit = useCallback(async (): Promise<boolean> => {
    if (!canSubmit || !detail || !selectedDate || !selectedSlot || isSubmitting) {
      return false;
    }

    const result = attempt({ event: 'confirmAppointment', actor: 'expert', facts: detail });
    if (!result.ok) {
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
      });
      return true;
    } catch (err) {
      if (isMounted.current) {
        setSubmitError(describeError(err, SUBMIT_ERROR));
      }
      return false;
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  }, [canSubmit, detail, selectedDate, selectedSlot, isSubmitting, reportId, noteToFarmer]);

  return {
    detail,
    error,
    isLoading,
    retry: load,
    enabledDates,
    selectedDate,
    selectDate,
    selectedSlot,
    setSelectedSlot,
    noteToFarmer,
    setNoteToFarmer,
    canSubmit,
    isSubmitting,
    submitError,
    submit,
  };
}
