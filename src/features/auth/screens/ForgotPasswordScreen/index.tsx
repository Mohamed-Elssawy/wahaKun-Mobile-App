import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackHeader, Button, Screen, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, roleVariants, screenPadding, spacing } from '@/theme';

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
      setValidationError(t('errors.auth.invalidEmail'));
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
            label={t('s09.backToLogin')}
            // "Back to login": returns to the S-03b this was opened from, rather than stacking another.
            onPress={() => navigation.navigate('EmailLogin', undefined, { pop: true })}
            showArrow
          />
        }
      >
        <BackHeader onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          <View style={styles.success}>
            <MailCheck size={SUCCESS_ICON} color={colors.primary} />
            <Text variant="h3" color="textStrong" align="center">
              {t('s09.sentTitle')}
            </Text>
            <Text variant="body14" color="textMuted" align="center">
              {t('s09.sentBody', { email: trimmed })}
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
          label={t('s09.cta')}
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
            {t('s03b.forgotPassword')}
          </Text>
          <Text variant="body14" color="textMuted" align="center" style={styles.subtitle}>
            {t('s09.subtitle')}
          </Text>
        </View>

        <TextField
          label={t('common.email')}
          labelVariant={roleVariants.authFieldLabel}
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
  // C6: the frames set an auth subtitle at a narrower measure than the fields below it.
  subtitle: {
    paddingHorizontal: spacing[56],
  },
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
