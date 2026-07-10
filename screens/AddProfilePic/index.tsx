import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { ArrowLeft, User } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import styles from './AddProfilePic';

const AddProfilePic = ({ navigation, route }: any) => {
  const [image, setImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fullName = route?.params?.fullName ?? '';

  const handleNextPress = () => {
    navigation.navigate('EnterYourPhoneNumber', {
      fullName,
      profileImage: image,
    });
  };

  const handleStepBackPress = () => {
    navigation.navigate('EnterYourFullName');
  };

  const openCamera = () => {
    setModalVisible(false);

    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        saveToPhotos: true,
      },
      response => {
        if (response.didCancel) return;

        if (response.errorCode) {
          console.log(response.errorMessage);
          return;
        }

        if (response.assets?.length) {
          setImage(response.assets[0].uri ?? null);
        }
      },
    );
  };

  const openGallery = () => {
    setModalVisible(false);

    launchImageLibrary(
      {
        mediaType: 'photo',
      },
      response => {
        if (response.didCancel) return;

        if (response.errorCode) {
          console.log(response.errorMessage);
          return;
        }

        if (response.assets?.length) {
          setImage(response.assets[0].uri ?? null);
        }
      },
    );
  };

  return (
    <SafeAreaProvider>
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
              <Text style={styles.addProfilePicTitle}>اضف صورتك الشخصية</Text>

              <Text style={styles.addProfilePicSubTitle}>
                أضف صورتك حتى يتعرف عليك الأعضاء الآخرون.
              </Text>
            </View>

            <View style={styles.imageContainer}>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
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
          <TouchableOpacity style={styles.skipButton} onPress={handleNextPress}>
            <Text style={styles.textOfSkip}>التخطي</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.textOfNext}>تحميل الصورة</Text>

            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ================= Modal ================= */}

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable style={styles.modalContainer}>
              <View style={styles.modalHandle} />

              <TouchableOpacity style={styles.modalButton} onPress={openCamera}>
                <Text style={styles.modalButtonText}>📷 التقاط صورة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={openGallery}
              >
                <Text style={styles.modalButtonText}>
                  🖼️ رفع صورة من المعرض
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AddProfilePic;
