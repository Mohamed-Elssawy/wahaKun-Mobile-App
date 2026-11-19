import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button, OtpInput, Screen, Text } from '@/components/ui';
import { useOtpVerification } from '@/features/auth/hooks/useOtpVerification';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import { ltrIsolate, t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { WizardHeader } from '../../components/WizardHeader';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/** Step 5 of the registration wizard. Confirms the OTP and stores tokens. */
export default function OtpScreen({ navigation, route }: ScreenProps<'Otp'>) {
  const { phoneNumber } = route.params;

  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const { verify, isVerifying, error: verifyError, setError } = useOtpVerification();
  const { secondsLeft, restart, isFinished } = useCountdown(RESEND_SECONDS);

  const isComplete = code.length === OTP_LENGTH;

  const handleVerify = async () => {
    if (!isComplete) {
      setValidationError(t('errors.auth.codeIncomplete'));
      return;
    }
    setValidationError('');

    if (await verify(code)) {
      navigation.navigate('RegistrationSuccess', { phoneNumber });
    }
  };

  const handleResend = () => {
    if (!isFinished) {
      return;
    }
    setCode('');
    setValidationError('');
    setError('');
    restart();
    // TODO: call a resend endpoint once AuthService has one. Only /Auth/Register issues OTPs.
  };

  return (
    <Screen
      footer={
        <Button
          label={t('common.verify')}
          onPress={handleVerify}
          showArrow
          loading={isVerifying}
          disabled={!isComplete}
        />
      }
    >
      <WizardHeader step={5} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            {t('s04.title')}
          </Text>
          <Text variant="body14" color="textMuted" align="center">
            {t('s04.sentBody', {
              otpLength: OTP_LENGTH,
              phoneNumber: ltrIsolate(phoneNumber),
            })}
          </Text>
        </View>

        <View style={styles.field}>
          <View style={styles.inputGroup}>
            <Text variant="label14" color="textSecondary">
              {t('s04.inputLabel')}
            </Text>

            <OtpInput value={code} onChange={setCode} length={OTP_LENGTH} />
          </View>

          <TouchableOpacity onPress={handleResend} disabled={!isFinished}>
            {isFinished ? (
              <Text variant="label12" color="primary" align="center">
                {t('s04.resend')}
              </Text>
            ) : (
              <Text variant="label12" color="textMuted" align="center">
                {t('s04.resendIn')}{' '}
                <Text variant="label12" color="primary">
                  {ltrIsolate(formatCountdown(secondsLeft))}
                </Text>
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {validationError || verifyError ? (
          <Text variant="label14Bold" color="errorText">
            {validationError || verifyError}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing[40],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[40],
  },
  intro: { gap: spacing[12] },
  field: { gap: spacing[12] },
  inputGroup: { gap: spacing[4] },
});
