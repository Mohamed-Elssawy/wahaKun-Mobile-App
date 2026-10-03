import { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { BackHeader, Button, Screen, Text, TextField } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { useLogin } from '../../hooks/useLogin';

import type { TextInput } from 'react-native';

export default function EmailLoginScreen({ navigation }: ScreenProps<'EmailLogin'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const { signInWithEmail, isLoading, error: signInError, setError } = useLogin();

  const isValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (isLoading) {
      return;
    }

    if (!isValid) {
      setValidationError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setValidationError('');

    if (await signInWithEmail(email.trim(), password)) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  };

  return (
    <Screen scrollable>
      <BackHeader onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            تسجيل الدخول
          </Text>

          <Text variant="body14" color="textMuted" align="center">
            {'استخدم بريدك الإلكتروني إذا لم\nتتمكن من الوصول لرقم هاتفك.'}
          </Text>
        </View>

        <View style={styles.fields}>
          <TextField
            label="البريد الإلكتروني"
            value={email}
            onChangeText={text => {
              setEmail(text);
              setValidationError('');
              setError('');
            }}
            placeholder="ahmed.rashidi@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <TextField
            ref={passwordRef}
            label="كلمة المرور"
            value={password}
            onChangeText={text => {
              setPassword(text);
              setValidationError('');
              setError('');
            }}
            placeholder="••••••••"
            secure
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            error={validationError || signInError}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword', { email })}
            activeOpacity={0.7}
          >
            <Text variant="body14" color="primary" align="center">
              نسيت كلمة المرور؟
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <Button
              label="تسجيل الدخول"
              onPress={handleLogin}
              showArrow
              loading={isLoading}
              disabled={!isValid}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('PhoneLogin')}
              activeOpacity={0.7}
            >
              <Text variant="body14" color="textMuted" align="center">
                أو{' '}
                <Text variant="body14" color="primary">
                  الدخول برقم الهاتف
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: spacing[40],
  },
  intro: {
    gap: spacing[12],
  },
  fields: {
    gap: spacing[24],
  },
  actions: {
    gap: spacing[16],
    marginTop: spacing[8],
  },
});