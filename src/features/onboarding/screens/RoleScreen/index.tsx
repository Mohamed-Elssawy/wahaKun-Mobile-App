import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import type { UserRole } from '@/features/auth/types';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import ExpertIcon from '@assets/icons/expert.svg';
import FarmerIcon from '@assets/icons/farmer.svg';

import { ActionCard } from '../../components/ActionCard';
import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';

/** Keys: a module-scope table resolved before §16.2 would freeze the locale. */
const ROLES: { role: UserRole; titleKey: TranslationKey; subtitleKey: TranslationKey }[] =
  [
    { role: 'farmer', titleKey: 's05.roleFarmer', subtitleKey: 's05.roleFarmerBody' },
    { role: 'expert', titleKey: 's05.roleExpert', subtitleKey: 's05.roleExpertBody' },
  ];

const ICON_SIZE = { width: 29, height: 32 };

/** Step 2. No admin option: those accounts are provisioned, never self-registered. */
export default function RoleScreen({ navigation }: ScreenProps<'Role'>) {
  const { update } = useRegistrationDraft();
  // One value, not two booleans, so picking a card inherently unpicks the other.
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!selectedRole) {
      setError(t('errors.auth.roleRequired'));
      return;
    }
    setError('');
    update({ role: selectedRole });
    navigation.navigate('EmailPassword');
  };

  return (
    <Screen
      footer={
        <Button
          label={t('common.next')}
          onPress={handleNext}
          showArrow
          disabled={!selectedRole}
        />
      }
    >
      <WizardHeader step={2} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <Text variant="h3" color="textStrong" align="center">
          {t('s05.roleTitle')}
        </Text>

        <View style={styles.cards}>
          {ROLES.map(({ role, titleKey, subtitleKey }) => {
            const Icon = role === 'farmer' ? FarmerIcon : ExpertIcon;
            const isSelected = selectedRole === role;
            return (
              <ActionCard
                key={role}
                icon={
                  <Icon
                    {...ICON_SIZE}
                    color={isSelected ? colors.primaryStrong : colors.primary}
                  />
                }
                title={t(titleKey)}
                subtitle={t(subtitleKey)}
                selected={isSelected}
                showChevron={false}
                onPress={() => {
                  setSelectedRole(role);
                  setError('');
                }}
              />
            );
          })}
        </View>

        {selectedRole === 'expert' ? (
          <Text variant="body12" color="successText" align="center">
            {t('s05.expertNotice')}
          </Text>
        ) : null}

        {error ? (
          <Text variant="label14Bold" color="errorText">
            {error}
          </Text>
        ) : null}
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
  cards: {
    gap: spacing[16],
  },
});
