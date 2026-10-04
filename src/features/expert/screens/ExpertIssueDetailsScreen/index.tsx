import { IssueDetailsBody } from '@/features/reports/components/IssueDetailsBody';
import type { ScreenProps } from '@/navigation/types';

/**
 * §8.3's E-07. Identical to F-04 but for two deltas: no public stepper (`C-NO-PUBLIC-STEPPER`)
 * and the back target lands on the expert surface that pushed it, never the farmer tracker.
 */
export default function ExpertIssueDetailsScreen({
  route,
  navigation,
}: ScreenProps<'ExpertIssueDetails'>) {
  const { reportId } = route.params;

  return (
    <IssueDetailsBody
      reportId={reportId}
      showPublicStepper={false}
      onBack={navigation.goBack}
      onOpenDiagnosis={() => navigation.navigate('ExpertDiagnosis', { reportId })}
    />
  );
}
