import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react-native';
import styles from './PhoneLogin';
import { useState } from 'react';
import * as authService from '../../../services/authService';
import { ApiError } from '../../../services/apiClient';

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

const PhoneLogin = ({ navigation }: any) => {
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

  const handleSendCode = async () => {
    if (!isValid) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }
    setError('');

    const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber}`;
    setIsLoading(true);
    try {
      await authService.loginWithPhone(fullPhoneNumber);
      setIsLoading(false);
      navigation.navigate('OTPScreenLogin', {
        phoneNumber: fullPhoneNumber,
      });
    } catch (err) {
      setIsLoading(false);
      const message =
        err instanceof ApiError ? err.message : 'تعذر إرسال رمز التحقق، حاول مرة أخرى';
      setError(message);
    }
  };

  const handleEmailLogin = () => {
    navigation.navigate('EmailLogin');
  };

  const handleCantAccess = () => {
    navigation.navigate('AccountRecovery');
  };

  const handleTermsPress = () => {
    navigation.navigate('TermsOfUse');
  };

  const handlePrivacyPress = () => {
    navigation.navigate('PrivacyPolicy');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowRight size={24} color="#1F2223" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.namingQuestion}>تسجيل الدخول</Text>
            <Text style={styles.namingSubQuestion}>
              أدخل رقم هاتفك للحصول على رمز{'\n'}تحقق وتسجيل الدخول بأمان.
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
                  keyboardType="phone-pad"
                  textAlign="left"
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.sendCodeButton, (!isValid || isLoading) && styles.disabledButton]}
            onPress={handleSendCode}
            activeOpacity={isValid ? 0.7 : 1}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.sendCodeText}>ارسال رمز التحقق</Text>
                <ArrowLeft size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.emailLoginButton}
            onPress={handleEmailLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.emailLoginText}>الدخول بالبريد الإلكتروني</Text>
            <Mail size={20} color="#57595A" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCantAccess} activeOpacity={0.7}>
            <Text style={styles.cantAccessText}>
              لا يمكنني الوصول لرقمي؟ <Text style={styles.cantAccessLink}>ماذا أفعل؟</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            باستخدامك للتطبيق، أنت توافق على{' '}
            <Text style={styles.footerLink} onPress={handleTermsPress}>
              شروط الاستخدام
            </Text>{' '}
            و{'\n'}
            <Text style={styles.footerLink} onPress={handlePrivacyPress}>
              سياسة الخصوصية
            </Text>
          </Text>
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

export default PhoneLogin;