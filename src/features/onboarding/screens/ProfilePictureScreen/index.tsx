import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Camera, Image as ImageIcon, User } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors, radii, screenPadding, spacing } from '@/theme';

import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';
import { useImagePicker } from '../../hooks/useImagePicker';

type PendingAction = 'camera' | 'gallery' | null;

/** Step 2 of the registration wizard. Optional — the user may skip. */
export default function ProfilePictureScreen({
  navigation,
}: ScreenProps<'ProfilePicture'>) {
  const { update } = useRegistrationDraft();
  const { image, error, pickFromCamera, pickFromGallery } = useImagePicker();
  const sheetRef = useRef<BottomSheetModal>(null);

  // Which picker to open once the sheet has finished closing, so the two
  // never overlap visually.
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

  const goNext = () => {
    update({ profileImage: image });
    navigation.navigate('Location');
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

  return (
    <BottomSheetModalProvider>
      <Screen
        footer={
          <>
            <Button
              label={image ? 'التالي' : 'تحميل الصورة'}
              onPress={image ? goNext : openSheet}
              showArrow={Boolean(image)}
            />
            <Button label="التخطي" variant="ghost" onPress={goNext} />
          </>
        }
      >
        <WizardHeader step={2} onBack={() => navigation.goBack()} />

        <View style={styles.body}>
          <View style={styles.intro}>
            <Text variant="h3" align="center">
              اضف صورتك الشخصية
            </Text>
            <Text variant="body14" color="textSecondary" align="center">
              أضف صورتك حتى يتعرف عليك الأعضاء الآخرون.
            </Text>
          </View>

          <TouchableOpacity onPress={openSheet} activeOpacity={0.8}>
            <View style={styles.avatar}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.avatarImage} />
              ) : (
                <User size={40} color={colors.background} />
              )}
            </View>
          </TouchableOpacity>

          {error ? (
            <Text variant="label14Bold" color="error" align="center">
              {error}
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
  body: {
    alignItems: 'center',
    gap: spacing.xxxl,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xxxl,
  },
  intro: {
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.textDisabled,
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
