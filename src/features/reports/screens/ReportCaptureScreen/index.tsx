import { CloudOff } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Camera } from 'react-native-vision-camera';

import { StateScreen } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors } from '@/theme';

import { CameraControlsBar } from '../../components/CameraControlsBar';
import { CameraPermissionDenied } from '../../components/CameraPermissionDenied';
import { CaptureHeader } from '../../components/CaptureHeader';
import { CaptureNotice } from '../../components/CaptureNotice';
import { LocationPermissionDenied } from '../../components/LocationPermissionDenied';
import { MicrophonePermissionDenied } from '../../components/MicrophonePermissionDenied';
import { PhotoReview } from '../../components/PhotoReview';
import { ReportErrorView } from '../../components/ReportErrorView';
import { VoiceCapture } from '../../components/VoiceCapture';
import { useReportCapture } from '../../hooks/useReportCapture';

import type { SubmitResult } from '../../hooks/useReportCapture';

/** The one submit outcome that keeps the farmer on this screen. */
type Outcome = Extract<SubmitResult['kind'], 'full'> | null;

/** F-02. Shutter and gallery share one review step (F-02b), so there is no chooser. */
export default function ReportCaptureScreen({
  route,
  navigation,
}: ScreenProps<'ReportCapture'>) {
  const {
    mode,
    changeMode,
    device,
    hasPermission,
    canFlipCamera,
    flipCamera,
    photoOutput,
    isPreviewActive,
    photo,
    photoSource,
    description,
    setDescription,
    requestMicrophone,
    capture,
    pickFromGallery,
    retakePhoto,
    submit,
    isSubmitting,
    submitError,
    error,
    isLocationDenied,
    // F-03c routes here asking for صوت when the model could not read a photo.
  } = useReportCapture(route.params?.mode);

  const [outcome, setOutcome] = useState<Outcome>(null);
  // X-04 answers a refused prompt; it is not the resting state of the صوت tab.
  const [isMicrophoneDenied, setIsMicrophoneDenied] = useState(false);

  const handleUsePhoto = async () => {
    const result = await submit();

    if (result.kind === 'queued') {
      // replace, not navigate: the photo is stored now, so back would only duplicate it.
      navigation.replace('ReportAnalyzing', { localId: result.localId });
      return;
    }

    if (result.kind === 'full') {
      setOutcome(result.kind);
    }
    // 'failed' means the photo could not be stored, and arrives through submitError.
  };

  /** The queue keeps working after this screen closes, so the list is the place to be. */
  const goToMyReports = () => navigation.navigate('Home', { screen: 'MyReports' });

  const renderBody = () => {
    // X-02a moved to ReportAnalyzing: offline is only known once the drain has tried.
    if (outcome === 'full') {
      return (
        <StateScreen
          icon={CloudOff}
          title="لديك بلاغات في انتظار الإرسال"
          message="انتظر حتى يعود الاتصال وتُرسل بلاغاتك السابقة، ثم أرسل هذا البلاغ."
          action={{ label: 'عرض بلاغاتي', onPress: goToMyReports }}
        />
      );
    }

    // X-05/D-HARD-BLOCK. No tertiary way out - location is mandatory, so the whole capture
    // surface is blocked, same precedence as the camera/mic walls below.
    if (isLocationDenied) {
      return <LocationPermissionDenied onOpenSettings={Linking.openSettings} />;
    }

    // No draft option alongside this one either, because saving is exactly what just failed.
    if (submitError) {
      return (
        <ReportErrorView
          error={submitError}
          unknownTitle="تعذر إرسال البلاغ"
          onRetry={handleUsePhoto}
        />
      );
    }

    if (photo) {
      return (
        <PhotoReview
          photo={photo}
          source={photoSource}
          isSubmitting={isSubmitting}
          error={error}
          onUse={handleUsePhoto}
          onRetake={retakePhoto}
        />
      );
    }

    if (mode === 'voice') {
      if (isMicrophoneDenied) {
        return (
          <MicrophonePermissionDenied
            onOpenSettings={Linking.openSettings}
            onUsePhoto={() => changeMode('photo')}
          />
        );
      }

      return (
        <VoiceCapture
          description={description}
          onDescriptionChange={setDescription}
          onNeedsPhoto={() => changeMode('photo')}
          onRequestMicrophone={requestMicrophone}
          onMicrophoneDenied={() => setIsMicrophoneDenied(true)}
        />
      );
    }

    if (!hasPermission) {
      return (
        <CameraPermissionDenied
          onOpenSettings={Linking.openSettings}
          onUseVoice={() => changeMode('voice')}
        />
      );
    }

    if (!device) {
      return <CaptureNotice title="لا توجد كاميرا متاحة" />;
    }

    // The preview itself is mounted at the root, below; this is just the controls.
    return (
      <CameraControlsBar
        onCapture={capture}
        onFlip={flipCamera}
        onOpenGallery={pickFromGallery}
        canFlip={canFlipCamera}
      />
    );
  };

  return (
    <View style={styles.screen}>
      {/* At the root: the Android preview is a SurfaceView that ignores its offset. */}
      {isPreviewActive && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          outputs={[photoOutput]}
        />
      ) : null}

      <CaptureHeader mode={mode} onModeChange={changeMode} onBack={navigation.goBack} />

      {/* Transparent while the preview is live, so it shows through. */}
      <View style={[styles.body, !isPreviewActive && styles.bodyOpaque]}>
        {renderBody()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyOpaque: {
    backgroundColor: colors.background,
  },
});
