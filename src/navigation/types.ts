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

/** §8.3's three tabs, listed left to right as the bar shows them, so الوارد lands on the right. */
export type ExpertTabParamList = {
  ExpertChats: undefined;
  ExpertMap: undefined;
  ExpertInbox: undefined;
};

/** A route must be listed here to exist, so a bad navigate() fails to compile. */
// The wizard's draft lives in RegistrationContext, outside navigation state.
export type RootStackParamList = {
  /** First launch only; firstRunStore decides whether the app boots here or at Welcome. */
  IntroSlideshow: undefined;
  Welcome: undefined;
  FullName: undefined;
  Role: undefined;
  EmailPassword: undefined;
  Phone: undefined;
  Otp: { phoneNumber: string };
  RegistrationSuccess: { phoneNumber: string; pendingApproval?: boolean };

  PhoneLogin: undefined;
  LoginOtp: { phoneNumber: string };
  EmailLogin: undefined;
  ForgotPassword: { email?: string } | undefined;
  /** Only ever reached by the emailed deep link; both params come off its query string. */
  ResetPassword: { token: string; email: string };

  TermsOfUse: undefined;
  PrivacyPolicy: undefined;

  Profile: undefined;
  /** Signup stopped collecting these, so S-07 is where they are set. */
  EditRegion: undefined;
  EditProfilePicture: undefined;

  /** `mode` opens a tab other than the camera; F-03c sends the farmer to صوت. */
  ReportCapture: { mode?: CaptureMode } | undefined;
  /** A localId, not a report id: analyze runs before create, so nothing has one yet. */
  ReportAnalyzing: { localId: string };
  ReportDiagnosis: { reportId: string };
  ConnectToExpert: { reportId: string };
  IssueDetails: { reportId: string };

  /** §8.3's E-02. `state` is set only when entered from an `E-01 · has-reopened` card. */
  ExpertCaseReview: { reportId: string; state?: 'reopened' };

  Home: NavigatorScreenParams<HomeTabParamList> | undefined;
  /** The expert shell. A separate root because §8.3's tabs are not the farmer's with a flag. */
  ExpertHome: NavigatorScreenParams<ExpertTabParamList> | undefined;

  /** S-08. Outside any shell, with one way out, so an unapproved expert reaches nothing else. */
  AccountStatus: { state: AccountStatusState };
  /** X-01. A cold-start guard only, per D-OFFLINE-FIRST; nothing in a flow may route here. */
  SessionError: undefined;
};

/** §4.1's three expert destinations that are not the shell. 'approved' is absent on purpose. */
export type AccountStatusState = 'pending' | 'rejected' | 'suspended';

/** The routes the app may boot at, so no dev shortcut can reach the rest. */
// Home and ExpertHome are here for session restore: a stored token boots straight in.
export type BootRoute = Extract<
  keyof RootStackParamList,
  'IntroSlideshow' | 'Welcome' | 'Home' | 'ExpertHome' | 'AccountStatus' | 'SessionError'
>;

/** A boot route with whatever params it needs, so initialRouteName stays typed either way. */
// Keyed `name`, matching a navigation route, so a decision can be handed to reset() as it is.
export type BootDecision =
  | { name: Exclude<BootRoute, 'AccountStatus'> }
  | { name: 'AccountStatus'; params: { state: AccountStatusState } };

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
