import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, PhoneField, Screen, Text } from '@/components/ui';
import { DEFAULT_COUNTRY } from '@/constants/countries';
import type { Country } from '@/constants/countries';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';
import { useRegistration } from '../../hooks/useRegistration';

/** Step 6 of the registration wizard — submits the account. */
export default function PhoneScreen({ navigation }: ScreenProps<'Phone'>) {
  const { draft } = useRegistrationDraft();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  const { submit, isSubmitting, error: submitError } = useRegistration();

  const isValid = phoneNumber.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      setValidationError('يرجى إدخال رقم الهاتف');
      return;
    }
    setValidationError('');

    const fullPhoneNumber = `${country.dialCode}${phoneNumber}`;
    const outcome = await submit(draft, fullPhoneNumber);

    if (!outcome) {
      return;
    }

    if (outcome.status === 'pending-approval') {
      navigation.navigate('RegistrationSuccess', {
        phoneNumber: fullPhoneNumber,
        pendingApproval: true,
      });
      return;
    }

    navigation.navigate('Otp', { phoneNumber: fullPhoneNumber });
  };

  return (
    <Screen
      footer={
        <Button
          label="ارسال رمز التحقق"
          onPress={handleSubmit}
          showArrow
          loading={isSubmitting}
          disabled={!isValid}
        />
      }
    >
      <WizardHeader step={6} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" align="center">
            أدخل رقم هاتفك
          </Text>
          <Text variant="body14" color="textSecondary" align="center">
            للحصول على رمز تحقق وتسجيل الدخول بأمان.
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
          error={validationError || submitError}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.xxxl,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xxxl,
  },
  intro: { gap: spacing.md },
});
