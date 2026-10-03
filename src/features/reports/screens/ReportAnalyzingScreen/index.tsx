import { Sprout } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ScreenProps } from '@/navigation/types';
import { colors } from '@/theme';

import { AnalyzingStatus } from '../../components/AnalyzingStatus';
import { QueuedConfirmationSheet } from '../../components/QueuedConfirmationSheet';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportFailureState } from '../../components/ReportFailureState';
import { ReportHeader } from '../../components/ReportHeader';
import { UnrecognizedPhotoState } from '../../components/UnrecognizedPhotoState';
import { useReportSubmission } from '../../hooks/useReportSubmission';

/** The header speaks for whichever state is on screen. */
const HEADINGS = {
  working: {
    title: 'جاري التحليل',
    subtitle: 'يحلل الذكاء الاصطناعي الصورة...',
  },
  unrecognized: {
    title: 'لم نتعرف على المشكلة',
    subtitle: 'لا تقلق، سنحاول مرة أخرى معًا',
  },
  tooMinor: {
    title: 'لا حاجة لبلاغ',
    subtitle: 'المشكلة تبدو بسيطة',
  },
  saved: {
    title: 'تم حفظ البلاغ',
    subtitle: 'سيُرسل تلقائيًا عند عودة الاتصال',
  },
} as const;

/** X-02. Watches one queued report through analyze and create, which is where its id comes from. */
export default function ReportAnalyzingScreen({
  route,
  navigation,
}: ScreenProps<'ReportAnalyzing'>) {
  const { localId } = route.params;
  const { state, retry, discard } = useReportSubmission(localId);

  useEffect(() => {
    if (state.kind === 'delivered') {
      // replace: the report is filed, so back would land on a screen with nothing to do.
      navigation.replace('ReportDiagnosis', { reportId: state.reportId });
    }
  }, [state, navigation]);

  const failureKind = state.kind === 'failed' ? state.error.kind : null;

  /** The queue keeps working after this screen closes, so the list is the place to be. */
  const goToMyReports = () => navigation.navigate('Home', { screen: 'MyReports' });

  // Every exit off F-03c drops the report, back included: it can never resolve.
  const startOver = (mode: 'photo' | 'voice') => {
    discard();
    navigation.replace('ReportCapture', { mode });
  };

  const goBack = () => {
    if (failureKind === 'unrecognized' || failureKind === 'tooMinor') {
      discard();
    }
    navigation.goBack();
  };

  const heading =
    failureKind === 'unrecognized'
      ? HEADINGS.unrecognized
      : failureKind === 'tooMinor'
        ? HEADINGS.tooMinor
        : state.kind === 'saved'
          ? HEADINGS.saved
          : HEADINGS.working;

  const renderBody = () => {
    if (failureKind === 'unrecognized') {
      return (
        <UnrecognizedPhotoState
          reason={state.kind === 'failed' ? state.error.message : undefined}
          onRetakePhoto={() => startOver('photo')}
          onUseVoice={() => startOver('voice')}
        />
      );
    }

    // ReportService refuses anything below Medium, so retrying the same photo cannot help.
    if (failureKind === 'tooMinor') {
      return (
        <ReportFailureState
          icon={Sprout}
          title="لا حاجة لبلاغ"
          message="حلّل الذكاء الاصطناعي الصورة ووجد أن المشكلة بسيطة ولا تستدعي بلاغًا. صوّر مشكلة أخرى إن احتجت."
          action={{ label: 'تصوير مشكلة أخرى', onPress: () => startOver('photo') }}
        />
      );
    }

    if (state.kind === 'failed') {
      return (
        <ReportErrorView
          error={state.error}
          unknownTitle="تعذر إرسال البلاغ"
          onRetry={retry}
        />
      );
    }

    // X-02a. Nothing was lost: the photo is stored and the queue will send it.
    if (state.kind === 'saved') {
      return <QueuedConfirmationSheet onViewReports={goToMyReports} />;
    }

    return <AnalyzingStatus />;
  };

  return (
    <View style={styles.screen}>
      <ReportHeader {...heading} onBack={goBack} />
      <View style={styles.body}>{renderBody()}</View>
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
