import { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import {
  BackHeader,
  Button,
  LanguageControl,
  LanguageDialog,
  Screen,
  Text,
  TextField,
} from '@/components/ui';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { useRouteAfterLogin } from '@/navigation/useRouteAfterLogin';
import { roleVariants, screenPadding, spacing } from '@/theme';

import { useLogin } from '../../hooks/useLogin';

import type { TextInput } from 'react-native';

export default function EmailLoginScreen({ navigation }: ScreenProps<'EmailLogin'>) {
  const language = useLanguageSwitch();
  const routeAfterLogin = useRouteAfterLogin();
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
      setValidationError(t('errors.auth.emailPasswordRequired'));
      return;
    }

    setValidationError('');

    if (await signInWithEmail(email.trim(), password)) {
      await routeAfterLogin();
    }
  };

  return (
    <Screen
      scrollable
      // C10: pinned to the bottom, as the frame has it, not inline under the fields.
      footer={
        <>
          <Button
            label={t('common.logIn')}
            onPress={handleLogin}
            showArrow
            loading={isLoading}
            disabled={!isValid}
          />

          <TouchableOpacity
            // Pops back to S-03 when it's below, else pushes; a plain navigate stacked a second S-03.
            onPress={() => navigation.navigate('PhoneLogin', undefined, { pop: true })}
            activeOpacity={0.7}
          >
            {/* C12: one string, so the sentence reads as one - "Or log in...", not "or Log in". */}
            <Text variant="body14" color="primary" align="center">
              {t('s03b.usePhone')}
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      {/* §12.1: opposite the chevron; G-01 puts back top-right in Arabic, so this lands top-left. */}
      <BackHeader
        onBack={() => navigation.goBack()}
        trailing={<LanguageControl onPress={language.open} />}
      />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="center">
            {t('common.logIn')}
          </Text>

          <Text variant="body14" color="textMuted" align="center" style={styles.subtitle}>
            {t('s03b.subtitle')}
          </Text>
        </View>

        <View style={styles.fields}>
          <TextField
            label={t('common.email')}
            labelVariant={roleVariants.authFieldLabel}
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
            label={t('common.password')}
            labelVariant={roleVariants.authFieldLabel}
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
              {t('s03b.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <LanguageDialog
        isVisible={language.isOpen}
        active={language.active}
        selected={language.selected}
        onSelect={language.select}
        onConfirm={language.confirm}
        onDismiss={language.dismiss}
        isApplying={language.state === 'applying'}
        error={language.error}
      />
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
    paddingBottom: spacing[40],
  },
  intro: {
    gap: spacing[12],
  },
  fields: {
    gap: spacing[24],
  },
});
