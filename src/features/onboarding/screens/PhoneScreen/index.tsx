import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, PhoneField, Screen, Text } from '@/components/ui';
import { defaultCountry } from '@/constants/countries';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';
import { useRegistration } from '../../hooks/useRegistration';

/** Step 4 of the registration wizard, and the one that submits. */
export default function PhoneScreen({ navigation }: ScreenProps<'Phone'>) {
  const { draft } = useRegistrationDraft();
  // C4: the country is locked to Egypt (SPEC 8 S-03), so there is no state to hold.
  const country = defaultCountry();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  const { submit, isSubmitting, error: submitError } = useRegistration();

  const isValid = phoneNumber.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      setValidationError(t('errors.auth.phoneRequired'));
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
          label={t('s03.cta')}
          onPress={handleSubmit}
          showArrow
          loading={isSubmitting}
          disabled={!isValid}
        />
      }
    >
      <WizardHeader step={4} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            {t('s05.phoneTitle')}
          </Text>
          <Text variant="body14" color="textMuted" align="center" style={styles.subtitle}>
            {t('s05.phoneSubtitle')}
          </Text>
        </View>

        <PhoneField
          label={t('common.phoneNumber')}
          country={country}
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
  // C6: the frames set an auth subtitle at a narrower measure than the fields below it.
  subtitle: {
    paddingHorizontal: spacing[56],
  },
  form: {
    gap: spacing[40],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[40],
  },
  intro: { gap: spacing[12] },
});
