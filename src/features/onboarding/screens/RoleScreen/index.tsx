import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import type { UserRole } from '@/features/auth/types';
import type { ScreenProps } from '@/navigation/types';
import { palette, screenPadding, spacing } from '@/theme';

import ExpertIcon from '@assets/icons/expert.svg';
import FarmerIcon from '@assets/icons/farmer.svg';

import { ActionCard } from '../../components/ActionCard';
import { WizardHeader } from '../../components/WizardHeader';
import { useRegistrationDraft } from '../../context/RegistrationContext';

const ROLES: { role: UserRole; title: string; subtitle: string }[] = [
  { role: 'farmer', title: 'مزارع', subtitle: 'الإبلاغ عن المشاكل وتتبعها' },
  { role: 'expert', title: 'خبير ميداني', subtitle: 'مراجعة وحل الحالات' },
];

const ICON_SIZE = { width: 29, height: 32 };

/**
 * Step 4 of the registration wizard.
 *
 * Only farmer and expert can self-register. Admin accounts are provisioned
 * and handed out, so there is no admin option here.
 */
export default function RoleScreen({ navigation }: ScreenProps<'Role'>) {
  const { update } = useRegistrationDraft();
  // A single value rather than two booleans, so picking one card inherently
  // means the other is unpicked.
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
      <WizardHeader step={4} onBack={() => navigation.goBack()} />

      <View style={styles.form}>
        <Text variant="h3" align="center">
          اختر دورك
        </Text>

        <View style={styles.cards}>
          {ROLES.map(({ role, title, subtitle }) => {
            const Icon = role === 'farmer' ? FarmerIcon : ExpertIcon;
            return (
              <ActionCard
                key={role}
                icon={<Icon {...ICON_SIZE} color={palette.primary.G700} />}
                title={title}
                subtitle={subtitle}
                selected={selectedRole === role}
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
          <Text variant="label14Bold" color="error" align="right">
            {error}
          </Text>
        ) : null}
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
  cards: {
    gap: spacing.lg,
  },
});
