import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text, TextField } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';

/** Step 1 of the registration wizard. */
export default function FullNameScreen({ navigation }: ScreenProps<'FullName'>) {
  const { update, reset } = useRegistrationDraft();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleExit = () => {
    // Abandoning the flow discards whatever was collected, so restarting it
    // does not resume from a half-filled draft.
    reset();
    navigation.navigate('Welcome');
  };

  const isValid = fullName.trim().length > 0;

  const handleNext = () => {
    if (!isValid) {
      setError('يرجى إدخال اسمك بالكامل للمتابعة');
      return;
    }
    setError('');
    update({ fullName: fullName.trim() });
    navigation.navigate('ProfilePicture');
  };

  return (
    <Screen
      footer={
        <Button label="التالي" onPress={handleNext} showArrow disabled={!isValid} />
      }
    >
      {/* Step 1 leaves the flow entirely rather than going back a step. */}
      <WizardHeader step={1} backLabel="الخروج" onBack={handleExit} />

      <View style={styles.form}>
        <Text variant="h3" align="center">
          ادخل اسمك بالكامل
        </Text>

        <TextField
          label="الاسم الكامل"
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
    gap: spacing.xxxl,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xxxl,
  },
});
