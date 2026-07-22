import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text, TextField } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';

/** Step 5 of the registration wizard. */
export default function EmailPasswordScreen({
  navigation,
}: ScreenProps<'EmailPassword'>) {
  const { update } = useRegistrationDraft();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isValid = email.trim().length > 0 && password.trim().length > 0;

  const handleNext = () => {
    if (!isValid) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setError('');
    update({ email: email.trim(), password });
    navigation.navigate('Phone');
  };

  return (
    <Screen
      footer={
        <Button label="التالي" onPress={handleNext} showArrow disabled={!isValid} />
      }
    >
      <WizardHeader step={5} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <View style={styles.intro}>
          <Text variant="h3" align="center">
            أدخل بريدك الإلكتروني
          </Text>
          <Text variant="body14" color="textSecondary" align="center">
            استخدمه للدخول في حال فقدان الوصول لرقم هاتفك.
          </Text>
        </View>

        <View style={styles.fields}>
          <TextField
            label="البريد الإلكتروني"
            value={email}
            onChangeText={text => {
              setEmail(text);
              setError('');
            }}
            placeholder="ahmed.rashidi@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextField
            label="كلمة المرور"
            value={password}
            onChangeText={text => {
              setPassword(text);
              setError('');
            }}
            placeholder="••••••••"
            secure
            autoComplete="new-password"
            error={error}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.xxxl,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xxxl,
  },
  intro: { gap: spacing.md },
  fields: { gap: spacing.xl },
});
