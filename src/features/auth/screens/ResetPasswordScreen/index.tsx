import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackHeader, Button, Screen, Text, TextField } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { usePasswordReset } from '../../hooks/usePasswordReset';

/** Identity's default minimum. The server is the authority; this only saves a round trip. */
const MIN_PASSWORD_LENGTH = 6;

/** Reached only by the emailed deep link, which carries the token and the email. */
export default function ResetPasswordScreen({
  navigation,
  route,
}: ScreenProps<'ResetPassword'>) {
  const { token, email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [validationError, setValidationError] = useState('');

  const { submitReset, isResetting, resetError, setResetError } = usePasswordReset();

  const isComplete = password.length >= MIN_PASSWORD_LENGTH && confirmation.length > 0;

  const handleSubmit = async () => {
    if (password !== confirmation) {
      setValidationError('كلمتا المرور غير متطابقتين');
      return;
    }
    setValidationError('');

    if (await submitReset(email, token, password)) {
      // reset, not navigate: the link opened the app cold, so there is no stack to keep.
      navigation.reset({ index: 0, routes: [{ name: 'EmailLogin' }] });
    }
  };

  const clearErrors = () => {
    setValidationError('');
    setResetError('');
  };

  return (
    <Screen
      footer={
        <Button
          label="تغيير كلمة المرور"
          onPress={handleSubmit}
          showArrow
          loading={isResetting}
          disabled={!isComplete}
        />
      }
    >
      <BackHeader onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            كلمة مرور جديدة
          </Text>
          <Text variant="body14" color="textMuted" align="center">
            {`اختر كلمة مرور جديدة لحساب\n${email}`}
          </Text>
        </View>

        <View style={styles.fields}>
          <TextField
            label="كلمة المرور الجديدة"
            value={password}
            onChangeText={text => {
              setPassword(text);
              clearErrors();
            }}
            placeholder="••••••••"
            secure
            autoComplete="new-password"
            autoFocus
          />

          <TextField
            label="تأكيد كلمة المرور"
            value={confirmation}
            onChangeText={text => {
              setConfirmation(text);
              clearErrors();
            }}
            placeholder="••••••••"
            secure
            autoComplete="new-password"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            error={validationError || resetError}
          />
        </View>
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
  fields: { gap: spacing[24] },
});
