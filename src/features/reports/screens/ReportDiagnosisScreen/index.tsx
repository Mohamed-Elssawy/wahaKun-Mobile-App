import type { ScreenProps } from '@/navigation/types';

import { ReportDiagnosisBody } from '../../components/ReportDiagnosisBody';

/** F-03a. Two entry points, and goBack() resolves both. */
export default function ReportDiagnosisScreen({
  route,
  navigation,
}: ScreenProps<'ReportDiagnosis'>) {
  const { reportId } = route.params;

  return (
    <ReportDiagnosisBody
      reportId={reportId}
      onBack={navigation.goBack}
      onOpenTracker={() => navigation.navigate('ReportTracker', { reportId })}
    />
  );
}
