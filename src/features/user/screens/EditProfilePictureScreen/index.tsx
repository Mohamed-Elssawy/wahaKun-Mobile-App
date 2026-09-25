import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Camera, Image as ImageIcon, User } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { BackHeader, Button, Screen, Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { useProfilePicture } from '../../hooks/useProfilePicture';
import { resolveProfilePictureUrl } from '../../services/userService';

type PendingAction = 'camera' | 'gallery' | null;

/** Signup stopped collecting a photo, so S-07's avatar badge is the way in. */
export default function EditProfilePictureScreen({
  navigation,
}: ScreenProps<'EditProfilePicture'>) {
  const {
    currentPicture,
    image,
    pickFromCamera,
    pickFromGallery,
    submit,
    isSubmitting,
    errorMessage,
    isLoading,
    loadError,
    retry,
  } = useProfilePicture();

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

  const handleSave = async () => {
    if (await submit()) {
      navigation.goBack();
    }
  };

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

  if (isLoading) {
    return (
      <Screen>
        <BackHeader onBack={() => navigation.goBack()} />
        <View style={styles.fallback}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <BackHeader onBack={() => navigation.goBack()} />
        <View style={styles.fallback}>
          <ReportErrorView
            error={loadError}
            unknownTitle="تعذر تحميل الملف الشخصي"
            onRetry={retry}
          />
        </View>
      </Screen>
    );
  }

  // The freshly picked one wins; otherwise show what the account already has.
  const previewUri =
    image?.uri ?? (currentPicture ? resolveProfilePictureUrl(currentPicture) : null);

  return (
    <BottomSheetModalProvider>
      <Screen
        footer={
          <>
            <Button
              label={image ? 'حفظ' : 'تحميل الصورة'}
              onPress={image ? handleSave : openSheet}
              showArrow={Boolean(image)}
              loading={isSubmitting}
            />
            <Button label="إلغاء" variant="ghost" onPress={() => navigation.goBack()} />
          </>
        }
      >
        <BackHeader onBack={() => navigation.goBack()} />

        <View style={styles.body}>
          <View style={styles.intro}>
            <Text variant="h3" color="textStrong" align="center">
              اضف صورتك الشخصية
            </Text>
            <Text variant="body14" color="textMuted" align="center">
              أضف صورتك حتى يتعرف عليك الأعضاء الآخرون.
            </Text>
          </View>

          <TouchableOpacity onPress={openSheet} activeOpacity={0.8}>
            <View style={styles.avatar}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.avatarImage} />
              ) : (
                <User size={40} color={colors.background} />
              )}
            </View>
          </TouchableOpacity>

          {errorMessage ? (
            <Text variant="label12Bold" color="errorText" align="center">
              {errorMessage}
            </Text>
          ) : null}
        </View>
      </Screen>

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
            <Camera size={22} color={colors.primary} />
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

const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
  },
  body: {
    alignItems: 'center',
    gap: spacing[40],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[40],
  },
  intro: {
    gap: spacing[12],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  sheetBackground: {
    backgroundColor: colors.surface,
  },
  sheetIndicator: {
    backgroundColor: colors.borderStrong,
  },
  sheetContent: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[32],
    gap: spacing[16],
  },
  sheetOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing[12],
    paddingVertical: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
});
