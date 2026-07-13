import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import styles from './PhoneNumberVerification';
import { useState } from 'react';

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

const PhoneNumberVerification = ({ navigation }: any) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState('');

  const isValid = phoneNumber.trim().length > 0;

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setPickerVisible(false);
    setError('');
  };

  const handleNextPress = () => {
    if (!isValid) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }
    setError('');
    navigation.navigate('OTPScreen', {
      phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
    });
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
            style={[styles.nextButton, !isValid && styles.disabledButton]}
            onPress={handleNextPress}
            activeOpacity={isValid ? 0.7 : 1}
          >
            <Text style={styles.textOfNext}>ارسال رمز التحقق</Text>
            <ArrowLeft size={24} color="#FFFFFF" />
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