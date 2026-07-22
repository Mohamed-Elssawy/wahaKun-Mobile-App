import { LogIn, UserPlus } from 'lucide-react-native';
import { Image, Linking, StyleSheet, View } from 'react-native';

import { Screen, Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { colors, fonts, screenPadding, spacing } from '@/theme';

import palmTreeLogo from '@assets/images/palmTreeLogo.png';

import { ActionCard } from '../../components/ActionCard';

const TERMS_URL = 'https://your-website.com/terms';

export default function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  return (
    <Screen
      footer={
        <Text variant="body14" color="textMuted" align="center">
          باستخدامك للتطبيق، أنت توافق على{' '}
          <Text
            variant="body14"
            color="primary"
            onPress={() => Linking.openURL(TERMS_URL)}
          >
            شروط الاستخدام و سياسة الخصوصية
          </Text>
        </Text>
      }
    >
      <View style={styles.brand}>
        <Image source={palmTreeLogo} style={styles.logo} />
        <View style={styles.brandText}>
          <Text style={styles.wordmark}>Waha KUN</Text>
          <Text variant="h5" color="primary">
            واحة كُن
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.intro}>
          <Text variant="h3" align="right">
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
            title="لدي حساب بالفعل"
            subtitle="سجل الدخول بسرعة"
            onPress={() => navigation.navigate('PhoneLogin')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.ms,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xxl,
  },
  logo: {
    width: 54,
    height: 53,
    resizeMode: 'contain',
  },
  brandText: {
    alignItems: 'flex-end',
  },
  // The Latin wordmark is the one piece of type not covered by a Figma text
  // style, so it is composed from tokens here rather than added to the scale.
  wordmark: {
    fontFamily: fonts.latin,
    fontSize: 26,
    lineHeight: 32,
    color: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xxxl,
    paddingHorizontal: screenPadding,
  },
  intro: {
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  cards: {
    gap: spacing.lg,
  },
});
