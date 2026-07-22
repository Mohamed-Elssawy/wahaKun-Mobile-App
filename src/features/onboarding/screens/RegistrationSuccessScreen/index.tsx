import { Image, StyleSheet, View } from 'react-native';

import { Button, ProgressBar, Screen, Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import palmTreeLogo from '@assets/images/palmTreeLogoBlack.png';

import { useRegistrationDraft } from '../../context/RegistrationContext';

/** Terminal step of the registration wizard. */
export default function RegistrationSuccessScreen({
  navigation,
  route,
}: ScreenProps<'RegistrationSuccess'>) {
  const pendingApproval = Boolean(route.params?.pendingApproval);
  const { reset: clearDraft } = useRegistrationDraft();

  const handleStart = () => {
    // The account exists now, so drop the draft — including the password —
    // rather than leaving it in memory for the rest of the session.
    clearDraft();
    // reset, not navigate — the whole wizard should be off the back stack.
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <Screen footer={<Button label="بداية استخدام التطبيق" onPress={handleStart} />}>
      {/* Terminal step, so no back control and the bar is full. */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image source={palmTreeLogo} style={styles.logo} />
          <Text variant="label14Bold" color="textStrong">
            النهاية
          </Text>
        </View>
        <ProgressBar step={1} totalSteps={1} />
      </View>

      <View style={styles.body}>
        <Text variant="h3" align="center">
          اكتمل التسجيل!
        </Text>
        <Text variant="body14" color="textSecondary" align="center">
          {pendingApproval
            ? 'تم تأكيد رقم هاتفك. حسابك كخبير الآن قيد المراجعة\nوسيتم إعلامك فور الموافقة عليه.'
            : 'يمكنك الأن الاستمتاع بجميع مزايا\nالتطبيق'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
  },
  brand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  logo: { width: 24, height: 24 },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: screenPadding,
  },
});
