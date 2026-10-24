import { Sprout } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { StateScreen } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors } from '@/theme';

import { AnalyzingStatus } from '../../components/AnalyzingStatus';
import { QueuedConfirmationSheet } from '../../components/QueuedConfirmationSheet';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHeader } from '../../components/ReportHeader';
import { UnrecognizedPhotoState } from '../../components/UnrecognizedPhotoState';
import { useReportSubmission } from '../../hooks/useReportSubmission';

import type { AnalyzingMode } from '../../types';

/** §8.4's three mode:working subtitles; the rest of HEADINGS does not vary by mode. */
const WORKING_SUBTITLE: Record<AnalyzingMode, string> = {
  photo: 'يحلل الذكاء الاصطناعي الصورة...',
  voice: 'يحلل الذكاء الاصطناعي تسجيلك...',
  text: 'يحلل الذكاء الاصطناعي كتابتك...',
};

/** The header speaks for whichever state is on screen. */
const HEADINGS = {
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
  // photo is today's only real path; the others wait on voice or text submission landing.
  const mode: AnalyzingMode = route.params.mode ?? 'photo';
  const { state, retry, discard } = useReportSubmission(localId);

  useEffect(() => {
    if (state.kind === 'delivered') {
      // A reset, not a replace: back must land on F-07, not on whichever tab opened the flow.
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Home', params: { screen: 'MyReports' } },
          { name: 'ReportDiagnosis', params: { reportId: state.reportId } },
        ],
      });
    }
  }, [state, navigation]);

  const failureKind = state.kind === 'failed' ? state.error.kind : null;

  /** The queue keeps working after this screen closes, so the list is the place to be. */
  const goToMyReports = () => navigation.navigate('Home', { screen: 'MyReports' });

  // Every exit off F-03c drops the report, back included: it can never resolve.
  const startOver = (captureMode: 'photo' | 'voice') => {
    discard();
    navigation.replace('ReportCapture', { mode: captureMode });
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
          : { title: 'جاري التحليل', subtitle: WORKING_SUBTITLE[mode] };

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
        <StateScreen
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

    return <AnalyzingStatus mode={mode} />;
  };

  return (
    <View style={styles.screen}>
      {/* §8.2/§8.4: back is disabled while the model runs — a submitted report can't be cancelled. */}
      <ReportHeader {...heading} onBack={state.kind === 'working' ? undefined : goBack} />
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
