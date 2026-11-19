import { Sprout } from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { StateScreen } from '@/components/ui';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors } from '@/theme';

import { AnalyzingStatus } from '../../components/AnalyzingStatus';
import { CaptureHeader } from '../../components/CaptureHeader';
import { QueuedConfirmationSheet } from '../../components/QueuedConfirmationSheet';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportHeader } from '../../components/ReportHeader';
import { UnrecognizedPhotoState } from '../../components/UnrecognizedPhotoState';
import { serverReason } from '../../errors';
import { useQueuedPhoto } from '../../hooks/useQueuedPhoto';
import { useReportSubmission } from '../../hooks/useReportSubmission';

import type { AnalyzingMode } from '../../types';

/** §8.4's three mode:working subtitles; the rest of HEADINGS does not vary by mode. */
const WORKING_SUBTITLE: Record<AnalyzingMode, TranslationKey> = {
  photo: 'x02.analysingPhotoEllipsis',
  voice: 'x02.analysingVoiceEllipsis',
  text: 'x02.analysingTextEllipsis',
};

/** The header speaks for whichever state is on screen. Keys, resolved in the component. */
const HEADINGS = {
  unrecognized: {
    title: 'f03c.title',
    subtitle: 'f03c.reassurance',
  },
  tooMinor: {
    title: 'x02.tooMinorTitle',
    subtitle: 'x02.tooMinorHeadline',
  },
} as const satisfies Record<string, { title: TranslationKey; subtitle: TranslationKey }>;

const resolveHeading = (of: { title: TranslationKey; subtitle: TranslationKey }) => ({
  title: t(of.title),
  subtitle: t(of.subtitle),
});

/** X-02. Watches one queued report through analyze and create, which is where its id comes from. */
export default function ReportAnalyzingScreen({
  route,
  navigation,
}: ScreenProps<'ReportAnalyzing'>) {
  const { localId } = route.params;
  // photo is today's only real path; the others wait on voice or text submission landing.
  const mode: AnalyzingMode = route.params.mode ?? 'photo';
  const { state, retry, discard } = useReportSubmission(localId);
  const isSaved = state.kind === 'saved';
  const savedPhotoUri = useQueuedPhoto(localId);

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
  // popTo, not navigate: RN 7's navigate to a lower route PUSHES a second copy (W18 left X-02 mounted under F-07).
  const goToMyReports = () => navigation.popTo('Home', { screen: 'MyReports' });

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
      ? resolveHeading(HEADINGS.unrecognized)
      : failureKind === 'tooMinor'
        ? resolveHeading(HEADINGS.tooMinor)
        : { title: t('x02.analysingTitle'), subtitle: t(WORKING_SUBTITLE[mode]) };

  const renderBody = () => {
    if (failureKind === 'unrecognized') {
      return (
        <UnrecognizedPhotoState
          serverReason={
            state.kind === 'failed' ? serverReason(state.error.serverMessage) : undefined
          }
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
          title={t('x02.tooMinorTitle')}
          message={t('x02.tooMinorBody')}
          action={{ label: t('x02.captureAnother'), onPress: () => startOver('photo') }}
        />
      );
    }

    if (state.kind === 'failed') {
      return (
        <ReportErrorView
          error={state.error}
          unknownTitle={t('f02.submitErrorTitle')}
          onRetry={retry}
        />
      );
    }

    return <AnalyzingStatus mode={mode} />;
  };

  // X-02a (C36): F-02 replaces itself here, so this redraws its header and photo behind the scrim rather than relying on a transparent route.
  if (isSaved) {
    return (
      <View style={styles.screen}>
        <View
          style={styles.surface}
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <CaptureHeader
            mode={mode === 'voice' ? 'voice' : 'photo'}
            onModeChange={ignoreModeChange}
            onBack={goBack}
          />
          <View style={styles.body}>
            {savedPhotoUri ? (
              <Image
                source={{ uri: savedPhotoUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}
          </View>
          <View style={styles.scrim} />
        </View>

        <QueuedConfirmationSheet onViewReports={goToMyReports} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* §8.2/§8.4: back is disabled while the model runs — a submitted report can't be cancelled. */}
      <ReportHeader
        {...heading}
        onBack={state.kind === 'working' ? undefined : goBack}
        isBackDisabled={state.kind === 'working'}
      />
      <View style={styles.body}>{renderBody()}</View>
    </View>
  );
}

/** The redrawn header is behind a scrim and takes no touches; its toggle has nothing to change. */
const ignoreModeChange = () => {};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  surface: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
});
