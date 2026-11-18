import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BackHeader,
  Button,
  LanguageControl,
  LanguageDialog,
  PhoneField,
  Screen,
  Text,
} from '@/components/ui';
import { defaultCountry } from '@/constants/countries';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { useLogin } from '../../hooks/useLogin';

export default function PhoneLoginScreen({ navigation }: ScreenProps<'PhoneLogin'>) {
  const language = useLanguageSwitch();
  // C4: the country is locked to Egypt (SPEC 8 S-03), so there is no state to hold.
  const country = defaultCountry();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  const { requestPhoneOtp, isLoading, error: requestError } = useLogin();

  const isValid = phoneNumber.trim().length > 0;

  const handleSendCode = async () => {
    if (!isValid) {
      setValidationError(t('errors.auth.phoneRequired'));
      return;
    }
    setValidationError('');

    const fullPhoneNumber = `${country.dialCode}${phoneNumber}`;
    if (await requestPhoneOtp(fullPhoneNumber)) {
      navigation.navigate('LoginOtp', { phoneNumber: fullPhoneNumber });
    }
  };

  return (
    <Screen
      footer={
        <Text variant="body14" color="textMuted" align="center">
          {t('common.legalPrefix')}{' '}
          <Text
            variant="body14"
            color="primary"
            onPress={() => navigation.navigate('TermsOfUse')}
          >
            {t('common.termsOfUse')}
          </Text>{' '}
          {t('common.and')}
          {'\n'}
          <Text
            variant="body14"
            color="primary"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            {t('common.privacyPolicy')}
          </Text>
        </Text>
      }
    >
      {/* §12.1: the control takes the end edge, opposite the chevron. */}
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
            {t('s03.subtitle')}
          </Text>
        </View>

        <PhoneField
          label={t('common.phoneNumber')}
          country={country}
          value={phoneNumber}
          onChangeText={text => {
            setPhoneNumber(text);
            setValidationError('');
          }}
          error={validationError || requestError}
        />

        <Button
          label={t('s03.cta')}
          onPress={handleSendCode}
          showArrow
          loading={isLoading}
          disabled={!isValid}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text variant="label20" color="textMuted">
            {t('common.or')}
          </Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label={t('s03.useEmail')}
          variant="outline"
          onPress={() => navigation.navigate('EmailLogin')}
          icon={<Mail size={20} color={colors.textPrimary} />}
        />
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
    gap: spacing[24],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[24],
  },
  intro: { gap: spacing[12] },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderControl,
  },
});
