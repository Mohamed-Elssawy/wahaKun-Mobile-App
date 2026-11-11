import { IssueDetailsBody } from '@/features/reports/components/IssueDetailsBody';
import type { DiagnosisContent } from '@/features/reports/types';
import type { ScreenProps } from '@/navigation/types';

import { useExpertCaseDetail } from '../../hooks/useExpertCaseDetail';

import type { ExpertCaseDetail } from '../../types';

/** `CaseReviewResponse`'s analysis onto what the AI block draws. */
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

/** E-07. Like F-04 but with no public stepper, and the diagnosis is passed in from the review. */
export default function ExpertIssueDetailsScreen({
  route,
  navigation,
}: ScreenProps<'ExpertIssueDetails'>) {
  const { reportId } = route.params;
  const { detail } = useExpertCaseDetail(reportId);

  return (
    <IssueDetailsBody
      reportId={reportId}
      audience="expert"
      diagnosis={detail ? toContent(detail) : undefined}
      showPublicStepper={false}
      onBack={navigation.goBack}
      onOpenDiagnosis={() => navigation.navigate('ExpertDiagnosis', { reportId })}
    />
  );
}
