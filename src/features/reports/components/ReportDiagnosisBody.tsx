import { DiagnosisView } from './DiagnosisView';
import { useReportDiagnosis } from '../hooks/useReportDiagnosis';

import type { Audience } from '../lifecycle';
import type { AiAnalysis, DiagnosisContent } from '../types';

export type ReportDiagnosisBodyProps = {
  reportId: string;
  /** §10.2: the expert sees sub-threshold output, the farmer gets F-03b instead. */
  audience?: Audience;
  onBack: () => void;
  /** F-03b's CTA. */
  onOpenTracker?: () => void;
};

/** The wire shape onto what the screen draws. The title is the model's, T13's copy is not. */
function toContent(analysis: AiAnalysis): DiagnosisContent {
  return {
    title: analysis.problemArabic || analysis.problemName,
    severity: analysis.severity,
    confidence: analysis.confidence,
    recommendation: analysis.recommendation,
    repairSteps: analysis.repairSteps,
    explanation: analysis.explanation,
  };
}

/** F-03a. The farmer's half of DiagnosisView; an expert may not call the farmer route. */
export function ReportDiagnosisBody({
  reportId,
  audience = 'farmer',
  onBack,
  onOpenTracker,
}: ReportDiagnosisBodyProps) {
  const { report, error, isLoading, retry } = useReportDiagnosis(reportId);
  const analysis = report?.analysis;

  return (
    <DiagnosisView
      content={analysis ? toContent(analysis) : null}
      isLoading={isLoading}
      error={error}
      onRetry={retry}
      audience={audience}
      onBack={onBack}
      onOpenTracker={onOpenTracker}
    />
  );
}
