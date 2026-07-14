import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  User,
} from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import styles from './AddProfilePic';

type PendingAction = 'camera' | 'gallery' | null;

const AddProfilePic = ({ navigation, route }: any) => {
  const [image, setImage] = useState<string | null>(null);
  // The picked asset's type/fileName — combined with `image` (the uri) this
  // is exactly the {uri, type, name} shape RN's FormData needs to send the
  // picture as a real file part to the backend's `IFormFile? picture`.
  const [imageMeta, setImageMeta] = useState<{ type?: string; fileName?: string }>({});

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  // Tracks which action (if any) should run once the sheet has fully
  // closed — mirrors the previous "close, then open camera/gallery" flow.
  const pendingActionRef = useRef<PendingAction>(null);

  const fullName = route?.params?.fullName ?? '';
  const hasImage = !!image;

  // Sheet sizes itself to its content instead of using fixed snap points.
  const snapPoints = useMemo(() => [], []);

  const openSheet = () => bottomSheetModalRef.current?.present();

  const closeSheet = () => bottomSheetModalRef.current?.dismiss();

  const handleNextPress = () => {
    navigation.navigate('LocationSelection', {
      // carry every field collected so far forward through the flow
      ...route?.params,
      fullName,
      // kept as a plain {uri, type, fileName} object — this is threaded all
      // the way to PhoneNumberVerification, which builds the actual
      // multipart FormData sent to the backend.
      profileImage: image
        ? { uri: image, type: imageMeta.type, fileName: imageMeta.fileName }
        : null,
    });
  };

  const handleStepBackPress = () => {
    navigation.navigate('EnterYourFullName');
  };

  const handleUploadButtonPress = () => {
    if (hasImage) {
      handleNextPress();
    } else {
      openSheet();
    }
  };

  const runCameraPicker = () => {
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        saveToPhotos: true,
        quality: 0.7,
      },
      response => {
        if (response.didCancel) return;

        if (response.errorCode) {
          console.log(response.errorMessage);
          return;
        }

        if (response.assets?.length) {
          const asset = response.assets[0];
          setImage(asset.uri ?? null);
          setImageMeta({ type: asset.type, fileName: asset.fileName });
        }
      },
    );
  };

  const runGalleryPicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
      },
      response => {
        if (response.didCancel) return;

        if (response.errorCode) {
          console.log(response.errorMessage);
          return;
        }

        if (response.assets?.length) {
          const asset = response.assets[0];
          setImage(asset.uri ?? null);
          setImageMeta({ type: asset.type, fileName: asset.fileName });
        }
      },
    );
  };

  const openCamera = () => {
    pendingActionRef.current = 'camera';
    closeSheet();
  };

  const openGallery = () => {
    pendingActionRef.current = 'gallery';
    closeSheet();
  };

  // Fires once the sheet has fully finished its close animation — this is
  // where we run whichever picker the user tapped, so it never overlaps
  // visually with the closing sheet.
  const handleSheetDismiss = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;

    if (action === 'camera') runCameraPicker();
    if (action === 'gallery') runGalleryPicker();
  }, []);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <SafeAreaView style={styles.container}>
            <View style={styles.topOfPage}>
              <View style={styles.header}>
                <View style={styles.headerNavigation}>
                  <View style={styles.StepOneWithLogoContainer}>
                    <Image
                      source={require('../../assets/images/palmTreeLogoBlack.png')}
                      style={styles.palmTreeLogo}
                    />

                    <Text style={styles.stepOneText}>الخطوة الثانية</Text>
                  </View>

                  <TouchableOpacity onPress={handleStepBackPress}>
                    <Text style={styles.goBack}>العودة</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.progressTrack}>
                  <View style={styles.progressFill} />
                </View>
              </View>

              <View style={styles.imageUploadContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.addProfilePicTitle}>
                    اضف صورتك الشخصية
                  </Text>

                  <Text style={styles.addProfilePicSubTitle}>
                    أضف صورتك حتى يتعرف عليك الأعضاء الآخرون.
                  </Text>
                </View>

                <View style={styles.imageContainer}>
                  <TouchableOpacity onPress={openSheet} activeOpacity={0.8}>
                    <View style={styles.imageShape}>
                      {image ? (
                        <Image
                          source={{ uri: image }}
                          style={styles.profileImage}
                        />
                      ) : (
                        <User size={40} color="#F4F1EB" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleNextPress}
              >
                <Text style={styles.textOfSkip}>التخطي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleUploadButtonPress}
              >
                {' '}
                <Text style={styles.textOfNext}>
                  {' '}
                  {hasImage ? 'التالي' : 'تحميل الصورة'}{' '}
                </Text>{' '}
                <ArrowLeft size={24} color="#FFFFFF" />{' '}
              </TouchableOpacity>
            </View>

            {/* ================= Bottom Sheet ================= */}

            <BottomSheetModal
              ref={bottomSheetModalRef}
              snapPoints={snapPoints}
              enableDynamicSizing
              onDismiss={handleSheetDismiss}
              backdropComponent={renderBackdrop}
              backgroundStyle={styles.sheetBackground}
              handleIndicatorStyle={styles.sheetHandleIndicator}
              handleStyle={styles.sheetHandle}
            >
              <BottomSheetView style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>اختر طريقة إضافة الصورة</Text>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={openCamera}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>التقاط صورة</Text>
                  <Camera size={22} color="#1A6B3C" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonLast]}
                  onPress={openGallery}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>رفع صورة من المعرض</Text>
                  <ImageIcon size={22} color="#1A6B3C" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeSheet}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </BottomSheetView>
            </BottomSheetModal>
          </SafeAreaView>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default AddProfilePic;
