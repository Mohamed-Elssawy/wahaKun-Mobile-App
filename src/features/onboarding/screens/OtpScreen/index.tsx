import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button, OtpInput, Screen, Text } from '@/components/ui';
import { useOtpVerification } from '@/features/auth/hooks/useOtpVerification';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { WizardHeader } from '../../components/WizardHeader';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/** Step 7 of the registration wizard. Confirms the OTP and stores tokens. */
export default function OtpScreen({ navigation, route }: ScreenProps<'Otp'>) {
  const { phoneNumber } = route.params;

  const [code, setCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const { verify, isVerifying, error: verifyError, setError } = useOtpVerification();
  const { secondsLeft, restart, isFinished } = useCountdown(RESEND_SECONDS);

  const isComplete = code.length === OTP_LENGTH;

  const handleVerify = async () => {
    if (!isComplete) {
      setValidationError('يرجى إدخال رمز التحقق كاملاً');
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
          label="تحقق"
          onPress={handleVerify}
          showArrow
          loading={isVerifying}
          disabled={!isComplete}
        />
      }
    >
      <WizardHeader step={7} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" align="center">
            تحقق من رقمك
          </Text>
          <Text variant="body14" color="textSecondary" align="center">
            {`أرسلنا رمزاً مكوناً من ${OTP_LENGTH} أرقام إلى\n${phoneNumber}`}
          </Text>
        </View>

        <View style={styles.field}>
          <Text variant="label14" align="right">
            ادخل رمز التحقق
          </Text>

          <OtpInput value={code} onChange={setCode} length={OTP_LENGTH} />

          <TouchableOpacity onPress={handleResend} disabled={!isFinished}>
            <Text
              variant="label14"
              color={isFinished ? 'primary' : 'textDisabled'}
              align="right"
            >
              {isFinished
                ? 'إعادة إرسال الرمز'
                : `إعادة الإرسال خلال ${formatCountdown(secondsLeft)}`}
            </Text>
          </TouchableOpacity>
        </View>

        {validationError || verifyError ? (
          <Text variant="label14Bold" color="errorText" align="right">
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
});
