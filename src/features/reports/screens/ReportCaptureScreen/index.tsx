import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Camera as CameraIcon, CloudOff, Image as ImageIcon } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Camera } from 'react-native-vision-camera';

import { Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { CameraControlsBar } from '../../components/CameraControlsBar';
import { CameraPermissionDenied } from '../../components/CameraPermissionDenied';
import { CaptureHeader } from '../../components/CaptureHeader';
import { CaptureNotice } from '../../components/CaptureNotice';
import { PhotoReview } from '../../components/PhotoReview';
import { ReportErrorView } from '../../components/ReportErrorView';
import { UploadOptions } from '../../components/UploadOptions';
import { useReportCapture } from '../../hooks/useReportCapture';

type PendingAction = 'camera' | 'gallery' | null;

/** F-02. Shutter, camera and gallery all land in the same photo and the same review step. */
export default function ReportCaptureScreen({
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
    capture,
    pickFromCamera,
    pickFromGallery,
    discardPhoto,
    submit,
    isSubmitting,
    submitError,
    error,
  } = useReportCapture();

  const sheetRef = useRef<BottomSheetModal>(null);
  // Which picker to open after the sheet closes, so the two never overlap.
  const pendingAction = useRef<PendingAction>(null);

  const openSheet = () => sheetRef.current?.present();
  const closeSheet = () => sheetRef.current?.dismiss();

  const queuePicker = (action: Exclude<PendingAction, null>) => {
    pendingAction.current = action;
    closeSheet();
  };

  const handleSheetDismiss = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;

    if (action === 'camera') {
      pickFromCamera();
    } else if (action === 'gallery') {
      pickFromGallery();
    }
  }, [pickFromCamera, pickFromGallery]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleUsePhoto = async () => {
    const report = await submit();
    if (!report) {
      return;
    }

    // replace, not navigate: the report exists now, so back would only duplicate it.
    navigation.replace('ReportAnalyzing', { reportId: report.id });
  };

  const renderBody = () => {
    // X-05 takes the whole body, and the photo is held so retry resends it.
    if (submitError) {
      return (
        <ReportErrorView
          error={submitError}
          unknownTitle="تعذر إرسال البلاغ"
          // X-05 is this screen's offline frame, and X-01 says neither of its promises.
          offline={{
            icon: CloudOff,
            title: 'تعذر إرسال البلاغ',
            message: 'تحقق من اتصالك بالانترنت وحاول مرة أخرى. لن تُفقد بياناتك.',
          }}
          onRetry={handleUsePhoto}
        />
      );
    }

    // Shared by both modes: whatever produced the photo, it is reviewed here.
    if (photo) {
      return (
        <PhotoReview
          photo={photo}
          mode={mode}
          isSubmitting={isSubmitting}
          error={error}
          onUse={handleUsePhoto}
          onRetake={discardPhoto}
        />
      );
    }

    if (mode === 'upload') {
      return <UploadOptions onAttachPhoto={openSheet} error={error} />;
    }

    if (!hasPermission) {
      return <CameraPermissionDenied onOpenSettings={Linking.openSettings} />;
    }

    if (!device) {
      return <CaptureNotice title="لا توجد كاميرا متاحة" />;
    }

    // The preview itself is mounted at the root, below; this is just the controls.
    return (
      <CameraControlsBar
        onCapture={capture}
        onFlip={flipCamera}
        canFlip={canFlipCamera}
      />
    );
  };

  return (
    <BottomSheetModalProvider>
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

      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        onDismiss={handleSheetDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text variant="h5" align="center">
            اختر طريقة إضافة الصورة
          </Text>

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() => queuePicker('camera')}
            activeOpacity={0.7}
          >
            <Text variant="label16">التقاط صورة</Text>
            <CameraIcon size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() => queuePicker('gallery')}
            activeOpacity={0.7}
          >
            <Text variant="label16">رفع صورة من المعرض</Text>
            <ImageIcon size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetCancel}
            onPress={closeSheet}
            activeOpacity={0.7}
          >
            <Text variant="label16Bold" color="textSecondary">
              إلغاء
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // Takes whatever the header leaves; every branch positions itself in here.
  body: {
    flex: 1,
  },
  bodyOpaque: {
    backgroundColor: colors.background,
  },
  sheetBackground: {
    backgroundColor: colors.surface,
  },
  sheetIndicator: {
    backgroundColor: colors.borderStrong,
  },
  sheetContent: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  sheetOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
