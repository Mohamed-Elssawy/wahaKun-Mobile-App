import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EmailLoginScreen from '@/features/auth/screens/EmailLoginScreen';
import LoginOtpScreen from '@/features/auth/screens/LoginOtpScreen';
import PhoneLoginScreen from '@/features/auth/screens/PhoneLoginScreen';
import EmailPasswordScreen from '@/features/onboarding/screens/EmailPasswordScreen';
import FullNameScreen from '@/features/onboarding/screens/FullNameScreen';
import LocationScreen from '@/features/onboarding/screens/LocationScreen';
import OtpScreen from '@/features/onboarding/screens/OtpScreen';
import PhoneScreen from '@/features/onboarding/screens/PhoneScreen';
import ProfilePictureScreen from '@/features/onboarding/screens/ProfilePictureScreen';
import RegistrationSuccessScreen from '@/features/onboarding/screens/RegistrationSuccessScreen';
import RoleScreen from '@/features/onboarding/screens/RoleScreen';
import WelcomeScreen from '@/features/onboarding/screens/WelcomeScreen';

import { createPlaceholderScreen } from './PlaceholderScreen';

import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Designed but not built. Registered because existing screens navigate here. */
const HomeScreen = createPlaceholderScreen(
  'الرئيسية',
  'شاشة البداية قيد التطوير — تم تسجيل دخولك بنجاح.',
);
const ForgotPasswordScreen = createPlaceholderScreen('استعادة كلمة المرور');
const AccountRecoveryScreen = createPlaceholderScreen('استرداد الحساب');
const EmailOtpVerificationScreen = createPlaceholderScreen(
  'التحقق عبر البريد الإلكتروني',
);
const TermsOfUseScreen = createPlaceholderScreen('شروط الاستخدام');
const PrivacyPolicyScreen = createPlaceholderScreen('سياسة الخصوصية');

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Consistent slide transition on both platforms.
          animation: 'slide_from_left',
          animationDuration: 10,
          gestureEnabled: true,
          presentation: 'card',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="FullName" component={FullNameScreen} />
        <Stack.Screen name="ProfilePicture" component={ProfilePictureScreen} />
        <Stack.Screen name="Location" component={LocationScreen} />
        <Stack.Screen name="Role" component={RoleScreen} />
        <Stack.Screen name="EmailPassword" component={EmailPasswordScreen} />
        <Stack.Screen name="Phone" component={PhoneScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />

        <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
        <Stack.Screen name="LoginOtp" component={LoginOtpScreen} />
        <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="AccountRecovery" component={AccountRecoveryScreen} />
        <Stack.Screen
          name="EmailOtpVerification"
          component={EmailOtpVerificationScreen}
        />

        <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />

        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
