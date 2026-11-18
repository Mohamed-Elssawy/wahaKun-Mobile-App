import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { roleVariants, screenPadding, spacing } from '@/theme';

import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';

/** Step 1 of the registration wizard. */
export default function FullNameScreen({ navigation }: ScreenProps<'FullName'>) {
  const { update, reset } = useRegistrationDraft();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleExit = () => {
    // Abandoning discards the draft, so restarting never resumes half-filled.
    reset();
    // Back to Welcome, which is always under S-05.1: a navigate would stack a second one.
    navigation.popTo('Welcome');
  };

  const isValid = fullName.trim().length > 0;

  const handleNext = () => {
    if (!isValid) {
      setError(t('errors.auth.fullNameRequired'));
      return;
    }
    setError('');
    update({ fullName: fullName.trim() });
    navigation.navigate('Role');
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
      {/* Step 1 leaves the flow entirely rather than going back a step. */}
      <WizardHeader step={1} onBack={handleExit} />

      <View style={styles.form}>
        <Text variant="h3" color="textStrong" align="center">
          {t('s05.nameTitle')}
        </Text>

        <TextField
          label={t('common.fullName')}
          labelVariant={roleVariants.authFieldLabel}
          value={fullName}
          onChangeText={text => {
            setFullName(text);
            setError('');
          }}
          error={error}
          textAlign="right"
          autoFocus
          returnKeyType="next"
          onSubmitEditing={handleNext}
          keyboardType="name-phone-pad"
        />
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
});
