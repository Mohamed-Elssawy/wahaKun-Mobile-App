import type { ScreenProps } from '@/navigation/types';

import { IssueDetailsBody } from '../../components/IssueDetailsBody';

/** F-04. The farmer route: the public 3-node stepper shows, and the tracker link is live. */
export default function IssueDetailsScreen({
  route,
  navigation,
}: ScreenProps<'IssueDetails'>) {
  const { reportId } = route.params;

  return (
    <IssueDetailsBody
      reportId={reportId}
      showPublicStepper
      onBack={navigation.goBack}
      onOpenDiagnosis={() => navigation.navigate('ReportDiagnosis', { reportId })}
      onOpenTracker={() => navigation.navigate('ReportTracker', { reportId })}
    />
  );
}
