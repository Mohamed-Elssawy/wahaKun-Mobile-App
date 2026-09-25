import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import type { UserRole } from '@/features/auth/types';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import ExpertIcon from '@assets/icons/expert.svg';
import FarmerIcon from '@assets/icons/farmer.svg';

import { ActionCard } from '../../components/ActionCard';
import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';

const ROLES: { role: UserRole; title: string; subtitle: string }[] = [
  { role: 'farmer', title: 'مزارع', subtitle: 'الإبلاغ عن المشاكل و تتبعها' },
  { role: 'expert', title: 'خبير ميداني', subtitle: 'مراجعة و حل الحالات' },
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
      setError('يرجى تحديد دورك');
      return;
    }
    setError('');
    update({ role: selectedRole });
    navigation.navigate('EmailPassword');
  };

  return (
    <Screen
      footer={
        <Button label="التالي" onPress={handleNext} showArrow disabled={!selectedRole} />
      }
    >
      <WizardHeader step={2} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <Text variant="h3" color="textStrong" align="center">
          اختر دورك
        </Text>

        <View style={styles.cards}>
          {ROLES.map(({ role, title, subtitle }) => {
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
                title={title}
                subtitle={subtitle}
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

        {error ? (
          <Text variant="label14Bold" color="errorText" align="right">
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
