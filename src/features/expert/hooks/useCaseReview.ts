import { useCallback, useEffect, useRef, useState } from 'react';

import { communityApi } from '@/features/community/services';
import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import type { Severity } from '@/features/reports/types';

import { expertApi } from '../services';

import type { ExpertCaseDetail } from '../types';

const LOAD_ERROR = 'تعذر تحميل الحالة';
const SUBMIT_ERROR = 'تعذر إرسال المراجعة، حاول مرة أخرى';

/**
 * §8.3's E-02. Owns the override toggle and its two conditional fields, plus the always-on
 * expert note - all local state, deliberately. Nothing here persists on unmount: abandoning
 * the screen mid-review has to lose the input, because there are no drafts.
 */
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

  /** `C-OVERRIDE`. ON pre-fills severity with the AI's; OFF never clears what was typed, in
   * case the expert flips it back. */
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
    if (!canSubmit || isSubmitting) {
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const trimmedNote = expertNote.trim();

      if (trimmedNote) {
        // §10.5: ملاحظات الخبير posts here automatically - the expert never has to open the thread.
        await communityApi.postComment(reportId, trimmedNote);
      }

      await expertApi.submitReview({
        reportId,
        override:
          isOverrideOn && severity !== undefined
            ? { severity, correctedDiagnosis: correctedDiagnosis.trim() }
            : undefined,
        expertNote: trimmedNote || undefined,
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
  }, [
    canSubmit,
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
