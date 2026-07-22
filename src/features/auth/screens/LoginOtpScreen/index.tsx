import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { BackHeader, Button, OtpInput, Screen, Text } from '@/components/ui';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { useOtpVerification } from '../../hooks/useOtpVerification';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function LoginOtpScreen({ navigation, route }: ScreenProps<'LoginOtp'>) {
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

    if (await verify(phoneNumber, code)) {
      // reset, not navigate — login should not stay on the back stack.
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
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
    // TODO: call a resend endpoint once AuthService exposes one. Today a new
    // OTP is only issued as a side effect of /Auth/Login, so this restarts the
    // timer without requesting anything.
  };

  return (
    <Screen
      footer={
        <>
          <Button
            label="تحقق"
            onPress={handleVerify}
            showArrow
            loading={isVerifying}
            disabled={!isComplete}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('EmailOtpVerification', { phoneNumber })}
            activeOpacity={0.7}
          >
            <Text variant="body14" color="textMuted" align="center">
              لم تستلم الرمز؟{' '}
              <Text variant="body14" color="primary">
                تحقق من البريد الإلكتروني
              </Text>
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      <BackHeader onBack={() => navigation.goBack()} />

      <View style={styles.content}>
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
          <Text variant="label14Bold" color="error" align="right">
            {validationError || verifyError}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxxl,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xl,
  },
  intro: { gap: spacing.md },
  field: { gap: spacing.md },
});
