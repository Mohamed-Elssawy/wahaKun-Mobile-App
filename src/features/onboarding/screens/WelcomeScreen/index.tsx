import { LogIn, UserPlus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { LanguageControl, LanguageDialog, Screen, Text } from '@/components/ui';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { ActionCard } from '../../components/ActionCard';
import { BrandLockup } from '../../components/BrandLockup';

export default function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  const language = useLanguageSwitch();
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
          {/* C6: no forced break here, a fixed one gave English three lines instead of matching each frame. */}
          {t('common.and')}{' '}
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
      {/* §12.1: opposite the lockup; S-02 is a stack root with no back affordance, and gains none here. */}
      <BrandLockup trailing={<LanguageControl onPress={language.open} />} />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong">
            {t('s02.title')}
          </Text>
          <Text variant="body14" color="textMuted">
            {t('s02.subtitle')}
          </Text>
        </View>

        <View style={styles.cards}>
          <ActionCard
            icon={<UserPlus size={32} color={colors.primary} />}
            title={t('s02.newUserTitle')}
            subtitle={t('s02.newUserBody')}
            onPress={() => navigation.navigate('FullName')}
          />
          <ActionCard
            icon={<LogIn size={32} color={colors.primary} />}
            title={t('s02.existingTitle')}
            subtitle={t('s02.existingBody')}
            onPress={() => navigation.navigate('PhoneLogin')}
          />
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
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[40],
    paddingHorizontal: screenPadding,
  },
  intro: {
    gap: spacing[12],
    alignItems: 'flex-start',
  },
  cards: {
    gap: spacing[16],
  },
});
