import type { ScreenProps } from '@/navigation/types';

import { ReportDiagnosisBody } from '../../components/ReportDiagnosisBody';

/** F-03a. Two entry points: from X-02, back lands on F-07; from F-04's link, back lands on
 * F-04 - both are just navigation.goBack(), since push/pop already resolves the right target. */
export default function ReportDiagnosisScreen({
  route,
  navigation,
}: ScreenProps<'ReportDiagnosis'>) {
  return <ReportDiagnosisBody reportId={route.params.reportId} onBack={navigation.goBack} />;
}
