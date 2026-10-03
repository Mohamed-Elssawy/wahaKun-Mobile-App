import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { attempt } from '@/features/reports/lifecycle';
import { useImagePicker } from '@/hooks/useImagePicker';

import { expertApi } from '../services';

import type { ExpertCaseDetail } from '../types';

const LOAD_ERROR = 'تعذر تحميل الحالة';
const SUBMIT_ERROR = 'تعذر تأكيد الحل، حاول مرة أخرى';

/**
 * §8.3's E-04. The repair photo and `ملاحظات الحل` are both mandatory; `useImagePicker` already
 * holds at most one image, so "exactly one photo" needs no extra validation of its own.
 */
export function useConfirmRepair(reportId: string) {
  const [detail, setDetail] = useState<ExpertCaseDetail | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [notes, setNotes] = useState('');
  const { image: photo, error: photoError, pickFromCamera, pickFromGallery } = useImagePicker();

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

  const canSubmit = photo !== null && notes.trim().length > 0;

  const submit = useCallback(async (): Promise<boolean> => {
    if (!canSubmit || !detail || !photo || isSubmitting) {
      return false;
    }

    const result = attempt({ event: 'confirmRepair', actor: 'expert', facts: detail });
    if (!result.ok) {
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await expertApi.confirmRepair({ reportId, photo, notes: notes.trim() });
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
  }, [canSubmit, detail, photo, isSubmitting, reportId, notes]);

  return {
    detail,
    error,
    isLoading,
    retry: load,
    photo,
    photoError,
    pickFromCamera,
    pickFromGallery,
    notes,
    setNotes,
    canSubmit,
    isSubmitting,
    submitError,
    submit,
  };
}
