import { useCallback, useEffect, useRef, useState } from 'react';

import { communityApi } from '@/features/community/services';
import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { attempt } from '@/features/reports/lifecycle';
import type { Severity } from '@/features/reports/types';

import { expertApi } from '../services';

import type { ExpertCaseDetail } from '../types';

const LOAD_ERROR = 'تعذر تحميل الحالة';
const SUBMIT_ERROR = 'تعذر إرسال المراجعة، حاول مرة أخرى';

/** E-02. All local state: there are no drafts, so abandoning the screen loses the input. */
export function useCaseReview(reportId: string) {
  const [detail, setDetail] = useState<ExpertCaseDetail | null>(null);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isOverrideOn, setIsOverrideOn] = useState(false);
  const [severity, setSeverity] = useState<Severity | undefined>(undefined);
  const [correctedDiagnosis, setCorrectedDiagnosis] = useState('');
  const [expertNote, setExpertNote] = useState('');

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
      if (!isMounted.current) {
        return;
      }
      setDetail(result);

      // state:reopened pre-fills with the expert's own previous review, not the AI's.
      if (result.previousReview) {
        setIsOverrideOn(true);
        setSeverity(result.previousReview.severity);
        setCorrectedDiagnosis(result.previousReview.correctedDiagnosis);
        setExpertNote(result.previousReview.expertNote ?? '');
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

  /** ON pre-fills severity with the AI's; OFF never clears what was typed, in case it flips back. */
  const toggleOverride = useCallback(
    (next: boolean) => {
      setIsOverrideOn(next);
      if (next && severity === undefined && detail) {
        setSeverity(detail.severity);
      }
    },
    [severity, detail],
  );

  // OFF needs nothing at all; ON requires both a severity and a non-empty corrected diagnosis.
  const canSubmit =
    !isOverrideOn || (severity !== undefined && correctedDiagnosis.trim().length > 0);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!canSubmit || !detail || isSubmitting) {
      return false;
    }

    // Asking T5 tells the two apart: if scheduling is allowed the review already landed, so advance.
    if (attempt({ event: 'confirmAppointment', actor: 'expert', facts: detail }).ok) {
      return true;
    }

    // T4's guard also catches opening E-02 on a case a review has already landed on.
    const result = attempt({ event: 'submitReview', actor: 'expert', facts: detail });
    if (!result.ok) {
      setSubmitError(describeError(result.refusal, SUBMIT_ERROR));
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const trimmedNote = expertNote.trim();

      await expertApi.submitReview({
        reportId,
        override:
          isOverrideOn && severity !== undefined
            ? { severity, correctedDiagnosis: correctedDiagnosis.trim() }
            : undefined,
        expertNote: trimmedNote || undefined,
      });

      if (trimmedNote) {
        try {
          // A consequence of the review, not part of it: the review has already landed server-side.
          await communityApi.postComment(reportId, trimmedNote);
        } catch {
          // Swallowed on purpose - see the comment above.
        }
      }

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
  }, [
    canSubmit,
    detail,
    isSubmitting,
    expertNote,
    reportId,
    isOverrideOn,
    severity,
    correctedDiagnosis,
  ]);

  return {
    detail,
    error,
    isLoading,
    retry: load,
    isOverrideOn,
    toggleOverride,
    severity,
    setSeverity,
    correctedDiagnosis,
    setCorrectedDiagnosis,
    expertNote,
    setExpertNote,
    canSubmit,
    isSubmitting,
    submitError,
    submit,
  };
}
