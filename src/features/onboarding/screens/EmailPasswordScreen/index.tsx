import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text, TextField } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { PasswordRequirementsHint } from '../../components/PasswordRequirementsHint';
import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';
import { isPasswordValid } from '../../passwordRules';

const EMAIL_REQUIRED_ERROR = 'يرجى إدخال البريد الإلكتروني';
const PASSWORD_WEAK_ERROR = 'كلمة المرور لا تحقق الشروط أدناه';
const PASSWORD_MISMATCH_ERROR = 'كلمة المرور غير متطابقة';

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
    const nextEmailError = email.trim().length > 0 ? '' : EMAIL_REQUIRED_ERROR;
    const nextPasswordError = isPasswordValid(password) ? '' : PASSWORD_WEAK_ERROR;
    const nextConfirmError =
      nextPasswordError || confirmPassword === password ? '' : PASSWORD_MISMATCH_ERROR;

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
        <Button label="التالي" onPress={handleNext} showArrow disabled={!isValid} />
      }
    >
      <WizardHeader step={3} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            أدخل بريدك الإلكتروني
          </Text>
          <Text variant="body14" color="textMuted" align="center">
            استخدمه للدخول في حال فقدان الوصول لرقم هاتفك.
          </Text>
        </View>

        <View style={styles.fields}>
          <TextField
            label="البريد الإلكتروني"
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
              label="كلمة المرور"
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
            label="تأكيد كلمة المرور"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              setConfirmError('');
            }}
            onBlur={() => {
              if (confirmPassword && confirmPassword !== password) {
                setConfirmError(PASSWORD_MISMATCH_ERROR);
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
  form: {
    gap: spacing[40],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[40],
  },
  intro: { gap: spacing[12] },
  fields: { gap: spacing[24] },
  passwordGroup: { gap: spacing[8] },
});
