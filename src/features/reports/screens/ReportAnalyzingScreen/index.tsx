import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ESCALATE_LOW_CONFIDENCE } from '@/config/env';
import type { ScreenProps } from '@/navigation/types';
import { colors } from '@/theme';

import { AnalyzingStatus } from '../../components/AnalyzingStatus';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHeader } from '../../components/ReportHeader';
import { UnrecognizedPhotoState } from '../../components/UnrecognizedPhotoState';
import { useReportAnalysis } from '../../hooks/useReportAnalysis';

/** The header speaks for whichever of the two states is on screen. */
const HEADINGS = {
  analyzing: {
    title: 'جاري التحليل',
    subtitle: 'يحلل الذكاء الاصطناعي الصورة...',
  },
  unrecognized: {
    title: 'لم نتعرف على المشكلة',
    subtitle: 'لا تقلق، سنحاول مرة أخرى معًا',
  },
} as const;

/** Branches on Status, never on confidence: that threshold is the server's policy. */
// Replaces in both directions, since the report exists and going back would duplicate it.
export default function ReportAnalyzingScreen({
  route,
  navigation,
}: ScreenProps<'ReportAnalyzing'>) {
  const { reportId } = route.params;
  const { report, error, retry, discard } = useReportAnalysis(reportId);

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

  const isUnrecognized = error?.kind === 'unrecognized';

  // Every exit off F-03c deletes, back included: the report can never resolve.
  const startOver = (mode: 'photo' | 'voice') => {
    discard();
    // replace, not navigate: the report is gone, so there is nothing to return to.
    navigation.replace('ReportCapture', { mode });
  };

  const goBack = () => {
    // Only from F-03c; a spinner or a failure both leave a report a retry can rescue.
    if (isUnrecognized) {
      discard();
    }
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <ReportHeader
        {...HEADINGS[isUnrecognized ? 'unrecognized' : 'analyzing']}
        onBack={goBack}
      />

      <View style={styles.body}>
        {isUnrecognized ? (
          <UnrecognizedPhotoState
            onRetakePhoto={() => startOver('photo')}
            onUseVoice={() => startOver('voice')}
          />
        ) : error ? (
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
