import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EmailLoginScreen from '@/features/auth/screens/EmailLoginScreen';
import ForgotPasswordScreen from '@/features/auth/screens/ForgotPasswordScreen';
import LoginOtpScreen from '@/features/auth/screens/LoginOtpScreen';
import PhoneLoginScreen from '@/features/auth/screens/PhoneLoginScreen';
import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';
import EmailPasswordScreen from '@/features/onboarding/screens/EmailPasswordScreen';
import FullNameScreen from '@/features/onboarding/screens/FullNameScreen';
import IntroSlideshowScreen from '@/features/onboarding/screens/IntroSlideshowScreen';
import OtpScreen from '@/features/onboarding/screens/OtpScreen';
import PhoneScreen from '@/features/onboarding/screens/PhoneScreen';
import RegistrationSuccessScreen from '@/features/onboarding/screens/RegistrationSuccessScreen';
import RoleScreen from '@/features/onboarding/screens/RoleScreen';
import WelcomeScreen from '@/features/onboarding/screens/WelcomeScreen';
import IssueDetailsScreen from '@/features/reports/screens/IssueDetailsScreen';
import ReportAnalyzingScreen from '@/features/reports/screens/ReportAnalyzingScreen';
import ReportCaptureScreen from '@/features/reports/screens/ReportCaptureScreen';
import ReportDiagnosisScreen from '@/features/reports/screens/ReportDiagnosisScreen';
import EditProfilePictureScreen from '@/features/user/screens/EditProfilePictureScreen';
import EditRegionScreen from '@/features/user/screens/EditRegionScreen';
import ProfileScreen from '@/features/user/screens/ProfileScreen';

import { ExpertTabs } from './ExpertTabs';
import { HomeTabs } from './HomeTabs';
import { linking } from './linking';
import { createPlaceholderScreen } from './PlaceholderScreen';

import type { BootRoute, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Designed but not built. Registered because existing screens navigate here. */
const TermsOfUseScreen = createPlaceholderScreen('شروط الاستخدام');
const PrivacyPolicyScreen = createPlaceholderScreen('سياسة الخصوصية');
const ConnectToExpertScreen = createPlaceholderScreen('التواصل مع خبير');

export type RootNavigatorProps = {
  /** Typed as BootRoute so the boot-shortcut habit cannot be committed through this prop. */
  initialRouteName: BootRoute;
};

export function RootNavigator({ initialRouteName }: RootNavigatorProps) {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          // Consistent slide transition on both platforms.
          animation: 'slide_from_left',
          animationDuration: 10,
          gestureEnabled: true,
          presentation: 'card',
        }}
      >
        <Stack.Screen name="IntroSlideshow" component={IntroSlideshowScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="FullName" component={FullNameScreen} />
        <Stack.Screen name="Role" component={RoleScreen} />
        <Stack.Screen name="EmailPassword" component={EmailPasswordScreen} />
        <Stack.Screen name="Phone" component={PhoneScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />

        <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
        <Stack.Screen name="LoginOtp" component={LoginOtpScreen} />
        <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditRegion" component={EditRegionScreen} />
        <Stack.Screen name="EditProfilePicture" component={EditProfilePictureScreen} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />

        <Stack.Screen name="ReportCapture" component={ReportCaptureScreen} />
        <Stack.Screen name="ReportAnalyzing" component={ReportAnalyzingScreen} />
        <Stack.Screen name="ReportDiagnosis" component={ReportDiagnosisScreen} />
        <Stack.Screen name="ConnectToExpert" component={ConnectToExpertScreen} />
        <Stack.Screen name="IssueDetails" component={IssueDetailsScreen} />
        <Stack.Screen name="Home" component={HomeTabs} />
        <Stack.Screen name="ExpertHome" component={ExpertTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
