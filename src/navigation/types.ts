import type { CaptureMode } from '@/features/reports/types';

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** The four tabs behind the Home route, listed left to right as the bar shows them. */
export type HomeTabParamList = {
  CommunityFeed: undefined;
  OasisMap: undefined;
  ReportAnIssue: undefined;
  MyReports: undefined;
};

/** A route must be listed here to exist, so a bad navigate() fails to compile. */
// The wizard's draft lives in RegistrationContext, outside navigation state.
export type RootStackParamList = {
  Welcome: undefined;
  FullName: undefined;
  ProfilePicture: undefined;
  Location: undefined;
  Role: undefined;
  EmailPassword: undefined;
  Phone: undefined;
  Otp: { phoneNumber: string };
  RegistrationSuccess: { phoneNumber: string; pendingApproval?: boolean };

  PhoneLogin: undefined;
  LoginOtp: { phoneNumber: string };
  EmailLogin: undefined;
  ForgotPassword: { email?: string } | undefined;
  AccountRecovery: undefined;
  EmailOtpVerification: { phoneNumber: string };

  TermsOfUse: undefined;
  PrivacyPolicy: undefined;

  Profile: undefined;

  /** `mode` opens a tab other than the camera; F-03c sends the farmer to صوت. */
  ReportCapture: { mode?: CaptureMode } | undefined;
  /** A localId, not a report id: analyze runs before create, so nothing has one yet. */
  ReportAnalyzing: { localId: string };
  ReportDiagnosis: { reportId: string };
  ConnectToExpert: { reportId: string };
  IssueDetails: { reportId: string };

  Home: NavigatorScreenParams<HomeTabParamList> | undefined;
};

/** Props for a screen component, e.g. `ScreenProps<'Otp'>`. */
export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

/** Types useNavigation() in components that never receive screen props. */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
