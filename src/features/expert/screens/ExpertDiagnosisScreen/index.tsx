import { DiagnosisView } from '@/features/reports/components/DiagnosisView';
import type { DiagnosisContent } from '@/features/reports/types';
import type { ScreenProps } from '@/navigation/types';

import { useExpertCaseDetail } from '../../hooks/useExpertCaseDetail';

import type { ExpertCaseDetail } from '../../types';

/** `CaseReviewResponse`'s analysis onto what the screen draws. */
function toContent(detail: ExpertCaseDetail): DiagnosisContent {
  return {
    title: detail.title,
    severity: detail.severity,
    confidence: detail.confidence,
    recommendation: detail.recommendation,
    repairSteps: detail.repairSteps ?? [],
    explanation: detail.explanation,
  };
}

/** E-11. Reads the expert review route: the farmer list only answers with the caller's reports. */
export default function ExpertDiagnosisScreen({
  route,
  navigation,
}: ScreenProps<'ExpertDiagnosis'>) {
  const { reportId } = route.params;
  const { detail, error, isLoading, retry } = useExpertCaseDetail(reportId);

  return (
    <DiagnosisView
      content={detail ? toContent(detail) : null}
      isLoading={isLoading}
      error={error}
      onRetry={retry}
      audience="expert"
      onBack={navigation.goBack}
    />
  );
}
