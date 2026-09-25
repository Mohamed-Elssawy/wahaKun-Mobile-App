import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackHeader, Button, PhoneField, Screen, Text } from '@/components/ui';
import { DEFAULT_COUNTRY } from '@/constants/countries';
import type { Country } from '@/constants/countries';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { useLogin } from '../../hooks/useLogin';

export default function PhoneLoginScreen({ navigation }: ScreenProps<'PhoneLogin'>) {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  const { requestPhoneOtp, isLoading, error: requestError } = useLogin();

  const isValid = phoneNumber.trim().length > 0;

  const handleSendCode = async () => {
    if (!isValid) {
      setValidationError('يرجى إدخال رقم الهاتف');
      return;
    }
    setValidationError('');

    const fullPhoneNumber = `${country.dialCode}${phoneNumber}`;
    if (await requestPhoneOtp(fullPhoneNumber)) {
      navigation.navigate('LoginOtp', { phoneNumber: fullPhoneNumber });
    }
  };

  return (
    <Screen
      footer={
        <Text variant="body14" color="textMuted" align="center">
          باستخدامك للتطبيق، أنت توافق على{' '}
          <Text
            variant="body14"
            color="primary"
            onPress={() => navigation.navigate('TermsOfUse')}
          >
            شروط الاستخدام
          </Text>{' '}
          و{'\n'}
          <Text
            variant="body14"
            color="primary"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            سياسة الخصوصية
          </Text>
        </Text>
      }
    >
      <BackHeader onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            تسجيل الدخول
          </Text>
          <Text variant="body14" color="textMuted" align="center">
            {'أدخل رقم هاتفك للحصول على رمز\nتحقق وتسجيل الدخول بأمان.'}
          </Text>
        </View>

        <PhoneField
          label="رقم الهاتف"
          country={country}
          onCountryChange={setCountry}
          value={phoneNumber}
          onChangeText={text => {
            setPhoneNumber(text);
            setValidationError('');
          }}
          error={validationError || requestError}
        />

        <Button
          label="ارسال رمز التحقق"
          onPress={handleSendCode}
          showArrow
          loading={isLoading}
          disabled={!isValid}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text variant="label20" color="textMuted">
            أو
          </Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label="الدخول بالبريد الإلكتروني"
          variant="secondary"
          onPress={() => navigation.navigate('EmailLogin')}
          icon={<Mail size={20} color={colors.primary} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[24],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
  },
  intro: { gap: spacing[12] },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderControl,
  },
});
