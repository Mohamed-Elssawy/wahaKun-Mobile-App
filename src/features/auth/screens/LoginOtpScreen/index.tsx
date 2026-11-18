import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { BackHeader, Button, OtpInput, Screen, Text } from '@/components/ui';
import { formatCountdown, useCountdown } from '@/hooks/useCountdown';
import { ltrIsolate, t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { useRouteAfterLogin } from '@/navigation/useRouteAfterLogin';
import { screenPadding, spacing } from '@/theme';

import { useOtpVerification } from '../../hooks/useOtpVerification';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function LoginOtpScreen({ navigation, route }: ScreenProps<'LoginOtp'>) {
  const routeAfterLogin = useRouteAfterLogin();
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
      await routeAfterLogin();
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
    // TODO: call a resend endpoint once AuthService has one. Only /Auth/Login issues OTPs.
  };

  return (
    <Screen
      footer={
        <>
          <Button
            label={t('common.verify')}
            onPress={handleVerify}
            showArrow
            loading={isVerifying}
            disabled={!isComplete}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('EmailLogin')}
            activeOpacity={0.7}
          >
            <Text variant="body14" color="textMuted" align="center">
              {t('s04.noCodePrompt')}{' '}
              <Text variant="body14" color="primary">
                {t('s03.useEmail')}
              </Text>
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      <BackHeader onBack={() => navigation.goBack()} />

      <View style={styles.content}>
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
  content: {
    gap: spacing[40],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
  },
  intro: { gap: spacing[12] },
  field: { gap: spacing[12] },
  inputGroup: { gap: spacing[4] },
});
