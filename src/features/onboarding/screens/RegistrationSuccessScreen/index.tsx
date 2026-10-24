import { Image, StyleSheet, View } from 'react-native';

import { Button, ProgressBar, Screen, Text } from '@/components/ui';
import type { ScreenProps } from '@/navigation/types';
import { screenPadding, spacing } from '@/theme';

import palmTreeLogo from '@assets/images/palmTreeLogoBlack.png';

import { SuccessIllustration } from '../../components/SuccessIllustration';
import { useRegistrationDraft } from '../../context/RegistrationContext';

/** Terminal step of the registration wizard. */
export default function RegistrationSuccessScreen({
  navigation,
  route,
}: ScreenProps<'RegistrationSuccess'>) {
  const pendingApproval = Boolean(route.params?.pendingApproval);
  const { reset: clearDraft } = useRegistrationDraft();

  const handleStart = () => {
    // The account exists, so the draft and its password should not outlive it.
    clearDraft();
    // reset, not navigate: a pending expert has no session, so they land at the entry fork.
    navigation.reset({
      index: 0,
      routes: [{ name: pendingApproval ? 'Welcome' : 'Home' }],
    });
  };

  return (
    <Screen
      footer={
        <Button
          label={pendingApproval ? 'العودة للرئيسية' : 'بداية استخدام التطبيق'}
          onPress={handleStart}
          showArrow={!pendingApproval}
          showArrowEnd={pendingApproval}
        />
      }
    >
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
        <SuccessIllustration />
        <Text variant="h2" color="textStrong" align="center">
          {pendingApproval ? 'تم إرسال طلبك' : 'اكتمل التسجيل!'}
        </Text>
        <Text variant="body14" color="textMuted" align="center">
          {pendingApproval
            ? 'سيراجعه المشرف وسنرسل لك بريداً إلكترونياً عند الموافقة'
            : 'يمكنك الآن الاستمتاع بجميع مزايا\nالتطبيق'}
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
    gap: spacing[12],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[56],
    paddingBottom: spacing[12],
  },
  logo: { width: 24, height: 24 },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[12],
    paddingHorizontal: screenPadding,
  },
});
