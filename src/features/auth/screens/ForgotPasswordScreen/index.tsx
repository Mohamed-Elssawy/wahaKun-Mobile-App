import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackHeader, Button, Screen, Text, TextField } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { usePasswordReset } from '../../hooks/usePasswordReset';

const SUCCESS_ICON = 48;

/** No Figma frame exists for this, so it follows S-03b's grammar. */
export default function ForgotPasswordScreen({
  navigation,
  route,
}: ScreenProps<'ForgotPassword'>) {
  // Prefilled from EmailLogin, so the farmer does not retype what they just typed.
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [validationError, setValidationError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const { requestReset, isRequesting, requestError, setRequestError } =
    usePasswordReset();

  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  const dot = trimmed.lastIndexOf('.');
  const isValid = at > 0 && dot > at + 1 && dot < trimmed.length - 1;

  const handleSubmit = async () => {
    if (!isValid) {
      setValidationError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    setValidationError('');

    if (await requestReset(trimmed)) {
      setIsSent(true);
    }
  };

  if (isSent) {
    return (
      <Screen
        footer={
          <Button
            label="العودة لتسجيل الدخول"
            onPress={() => navigation.navigate('EmailLogin')}
            showArrow
          />
        }
      >
        <BackHeader onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          <View style={styles.success}>
            <MailCheck size={SUCCESS_ICON} color={colors.primary} />
            <Text variant="h3" color="textStrong" align="center">
              تحقق من بريدك الإلكتروني
            </Text>
            <Text variant="body14" color="textMuted" align="center">
              {`أرسلنا رابط إعادة تعيين كلمة المرور إلى\n${trimmed}`}
            </Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable
      footer={
        <Button
          label="إرسال رابط الاستعادة"
          onPress={handleSubmit}
          showArrow
          loading={isRequesting}
          disabled={!isValid}
        />
      }
    >
      <BackHeader onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            نسيت كلمة المرور؟
          </Text>
          <Text variant="body14" color="textMuted" align="center">
            {'أدخل بريدك الإلكتروني وسنرسل لك\nرابطاً لإعادة تعيين كلمة المرور.'}
          </Text>
        </View>

        <TextField
          label="البريد الإلكتروني"
          value={email}
          onChangeText={text => {
            setEmail(text);
            setValidationError('');
            setRequestError('');
          }}
          placeholder="ahmed.rashidi@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoFocus
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          error={validationError || requestError}
        />
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
  success: {
    alignItems: 'center',
    gap: spacing[16],
    paddingTop: spacing[40],
  },
});
