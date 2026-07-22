import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Every route in the app, and the single source of routing truth. A route must
 * be listed here to exist: a `navigate()` call to anything else is a compile
 * error rather than a runtime crash.
 *
 * The registration wizard's steps take no params. The draft they build lives in
 * RegistrationContext, deliberately outside navigation state; only phoneNumber
 * is passed, because the OTP and success screens display it.
 */
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

  Home: undefined;
};

/** Props for a screen component, e.g. `ScreenProps<'Otp'>`. */
export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

/**
 * Makes the default `useNavigation()` return type aware of these routes, so
 * navigation is typed even in components that do not receive screen props.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
