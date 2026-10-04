import { ReportDiagnosisBody } from '@/features/reports/components/ReportDiagnosisBody';
import type { ScreenProps } from '@/navigation/types';

/**
 * §8.3's E-11. An expert view of F-03a: identical content, reached from التشخيص الكامل on
 * E-02 and E-07. Back is navigation.goBack(), which already resolves to whichever pushed it.
 */
export default function ExpertDiagnosisScreen({
  route,
  navigation,
}: ScreenProps<'ExpertDiagnosis'>) {
  return <ReportDiagnosisBody reportId={route.params.reportId} onBack={navigation.goBack} />;
}
