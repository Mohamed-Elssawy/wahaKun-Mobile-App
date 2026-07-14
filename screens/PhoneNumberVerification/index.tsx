import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import styles from './PhoneNumberVerification';
import { useState } from 'react';
import * as authService from '../../services/authService';
import { ApiError } from '../../services/apiClient';

type Country = {
  name: string;
  flag: string;
  dialCode: string;
  code: string;
};

const COUNTRIES: Country[] = [
  { name: 'مصر', flag: '🇪🇬', dialCode: '+20', code: 'EG' },
  { name: 'اليابان', flag: '🇯🇵', dialCode: '+81', code: 'JP' },
  { name: 'السعودية', flag: '🇸🇦', dialCode: '+966', code: 'SA' },
  { name: 'الولايات المتحدة', flag: '🇺🇸', dialCode: '+1', code: 'US' },
  { name: 'المملكة المتحدة', flag: '🇬🇧', dialCode: '+44', code: 'GB' },
];

const PhoneNumberVerification = ({ navigation, route }: any) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = phoneNumber.trim().length > 0;

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setPickerVisible(false);
    setError('');
  };

  const handleNextPress = async () => {
    if (!isValid) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }
    setError('');

    const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber}`;
    const params = route?.params ?? {};

    setIsLoading(true);
    try {
      const formData = authService.buildRegisterFormData({
        FullName: params.fullName ?? '',
        village: params.location?.name ?? '',
        Region: params.governorate?.name ?? '',
        email: params.email ?? '',
        password: params.password ?? '',
        PhoneNumber: fullPhoneNumber,
        picture: params.profileImage ?? null,
      });

      if (params.role === 'expert') {
        // Expert accounts are created as "Pending" and don't go through OTP —
        // an admin has to approve them, so we send the user straight to the
        // success screen instead of the OTP step.
        await authService.createExpert(formData);
        setIsLoading(false);
        navigation.navigate('SuccessedRegistration', {
          phoneNumber: fullPhoneNumber,
          pendingApproval: true,
        });
        return;
      }

      // Farmer registration sends an OTP to the phone number.
      await authService.register(formData);
      setIsLoading(false);
      navigation.navigate('OTPScreen', {
        ...params,
        phoneNumber: fullPhoneNumber,
      });
    } catch (err) {
      setIsLoading(false);
      const message =
        err instanceof ApiError ? err.message : 'حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى';
      setError(message);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerAndInputText}>
          <View style={styles.header}>
            <View style={styles.headerNavigation}>
              <View style={styles.StepOneWithLogoContainer}>
                <Image
                  source={require('../../assets/images/palmTreeLogoBlack.png')}
                  style={styles.palmTreeLogo}
                />
                <Text style={styles.stepOneText}>الخطوة السادسة</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.goBack}>العودة</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
          <View style={styles.formContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.namingQuestion}>أدخل رقم هاتفك</Text>
              <Text style={styles.namingSubQuestion}>
                للحصول على رمز تحقق وتسجيل الدخول بأمان.
              </Text>
            </View>

            <View style={styles.inputfeildContainer}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>رقم الهاتف</Text>
                <View style={styles.phoneInputRow}>
                  <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setPickerVisible(true)}
                    activeOpacity={0.7}
                  >
                    <ChevronDown size={16} color="#57595A" />
                    <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
                    <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                  </TouchableOpacity>

                  <View style={styles.phoneDivider} />

                  <TextInput
                    style={styles.phoneNumberInput}
                    value={phoneNumber}
                    onChangeText={text => {
                      setPhoneNumber(text.replace(/[^0-9]/g, ''));
                      setError('');
                    }}
                    placeholderTextColor="#B1B2B2"
                    keyboardType="phone-pad"
                    textAlign="left"
                  />
                </View>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, (!isValid || isLoading) && styles.disabledButton]}
            onPress={handleNextPress}
            activeOpacity={isValid ? 0.7 : 1}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.textOfNext}>ارسال رمز التحقق</Text>
                <ArrowLeft size={24} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Modal
          visible={isPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setPickerVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>اختر الدولة</Text>
              <FlatList
                data={COUNTRIES}
                keyExtractor={item => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.countryListItem,
                      selectedCountry.code === item.code && styles.countryListItemSelected,
                    ]}
                    onPress={() => handleSelectCountry(item)}
                  >
                    <Text style={styles.countryListDial}>{item.dialCode}</Text>
                    <View style={styles.countryListNameRow}>
                      <Text style={styles.countryListName}>{item.name}</Text>
                      <Text style={styles.flagText}>{item.flag}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default PhoneNumberVerification;