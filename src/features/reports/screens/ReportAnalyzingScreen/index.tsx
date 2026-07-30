import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ESCALATE_LOW_CONFIDENCE } from '@/config/env';
import type { ScreenProps } from '@/navigation/types';
import { colors } from '@/theme';

import { AnalyzingStatus } from '../../components/AnalyzingStatus';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHeader } from '../../components/ReportHeader';
import { useReportAnalysis } from '../../hooks/useReportAnalysis';

/** Branches on Status, never on confidence: that threshold is the server's policy. */
// Replaces in both directions, since the report exists and going back would duplicate it.
export default function ReportAnalyzingScreen({
  route,
  navigation,
}: ScreenProps<'ReportAnalyzing'>) {
  const { reportId } = route.params;
  const { report, error, retry } = useReportAnalysis(reportId);

  useEffect(() => {
    if (!report) {
      return;
    }

    // The hook guarantees these are the only two statuses that reach here.
    if (ESCALATE_LOW_CONFIDENCE && report.status === 'Escalated') {
      navigation.replace('ConnectToExpert', { reportId: report.id });
    } else {
      navigation.replace('ReportDiagnosis', { reportId: report.id });
    }
  }, [report, navigation]);

  return (
    <View style={styles.screen}>
      <ReportHeader
        title="جاري التحليل"
        subtitle="يحلل الذكاء الاصطناعي الصورة..."
        onBack={navigation.goBack}
      />

      <View style={styles.body}>
        {error ? (
          <ReportErrorView
            error={error}
            unknownTitle="تعذر تحليل البلاغ"
            onRetry={retry}
          />
        ) : (
          <AnalyzingStatus />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
});
