import { LogIn, UserPlus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Screen, Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { ActionCard } from '../../components/ActionCard';
import { BrandLockup } from '../../components/BrandLockup';

export default function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  return (
    <Screen
      footer={
        <Text variant="body14" color="textMuted" align="center">
          باستخدامك للتطبيق، أنت توافق على{' '}
          <Text
            variant="body14"
            color="primary"
            onPress={() => navigation.navigate('TermsOfUse')}
          >
            شروط الاستخدام
          </Text>{' '}
          و{'\n'}
          <Text
            variant="body14"
            color="primary"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            سياسة الخصوصية
          </Text>
        </Text>
      }
    >
      <BrandLockup />

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h3" color="textStrong" align="right">
            مرحباً بك
          </Text>
          <Text variant="body14" color="textMuted" align="right">
            هل تستخدم التطبيق للمرة الأولى؟
          </Text>
        </View>

        <View style={styles.cards}>
          <ActionCard
            icon={<UserPlus size={32} color={colors.primary} />}
            title="مستخدم جديد"
            subtitle="أنشئ حسابك الآن وابدأ"
            onPress={() => navigation.navigate('FullName')}
          />
          <ActionCard
            icon={<LogIn size={32} color={colors.primary} />}
            title="لديّ حساب بالفعل"
            subtitle="سجّل الدخول بسرعة"
            onPress={() => navigation.navigate('PhoneLogin')}
          />
        </View>
      </View>
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
    alignItems: 'flex-end',
  },
  cards: {
    gap: spacing[16],
  },
});
