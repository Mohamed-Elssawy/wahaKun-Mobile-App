import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { roleVariants, screenPadding, spacing } from '@/theme';

import { PasswordRequirementsHint } from '../../components/PasswordRequirementsHint';
import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';
import { isPasswordValid } from '../../passwordRules';

/** Step 3 of the registration wizard. */
export default function EmailPasswordScreen({
  navigation,
}: ScreenProps<'EmailPassword'>) {
  const { update } = useRegistrationDraft();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const isValid =
    email.trim().length > 0 && isPasswordValid(password) && confirmPassword === password;

  const handleNext = () => {
    const nextEmailError = email.trim().length > 0 ? '' : t('errors.auth.emailRequired');
    const nextPasswordError = isPasswordValid(password)
      ? ''
      : t('errors.auth.passwordWeak');
    const nextConfirmError =
      nextPasswordError || confirmPassword === password
        ? ''
        : t('errors.auth.passwordMismatch');

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);

    if (nextEmailError || nextPasswordError || nextConfirmError) {
      return;
    }

    update({ email: email.trim(), password });
    navigation.navigate('Phone');
  };

  return (
    <Screen
      footer={
        <Button
          label={t('common.next')}
          onPress={handleNext}
          showArrow
          disabled={!isValid}
        />
      }
    >
      <WizardHeader step={3} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            {t('s05.emailTitle')}
          </Text>
          <Text variant="body14" color="textMuted" align="center" style={styles.subtitle}>
            {t('s05.emailSubtitle')}
          </Text>
        </View>

        <View style={styles.fields}>
          <TextField
            label={t('common.email')}
            labelVariant={roleVariants.authFieldLabel}
            value={email}
            onChangeText={text => {
              setEmail(text);
              setEmailError('');
            }}
            placeholder="ahmed.rashidi@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={emailError}
          />

          <View style={styles.passwordGroup}>
            <TextField
              label={t('common.password')}
              labelVariant={roleVariants.authFieldLabel}
              value={password}
              onChangeText={text => {
                setPassword(text);
                setPasswordError('');
                // Stale until the confirm field is revisited, rather than flagged on every keystroke.
                setConfirmError('');
              }}
              placeholder="••••••••"
              secure
              autoComplete="new-password"
              error={passwordError}
            />
            <PasswordRequirementsHint password={password} />
          </View>

          <TextField
            label={t('common.confirmPassword')}
            labelVariant={roleVariants.authFieldLabel}
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              setConfirmError('');
            }}
            onBlur={() => {
              if (confirmPassword && confirmPassword !== password) {
                setConfirmError(t('errors.auth.passwordMismatch'));
              }
            }}
            placeholder="••••••••"
            secure
            autoComplete="new-password"
            returnKeyType="send"
            onSubmitEditing={handleNext}
            error={confirmError}
          />
        </View>
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
  fields: { gap: spacing[24] },
  passwordGroup: { gap: spacing[8] },
});
