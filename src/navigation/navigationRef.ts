import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/** Lets non-screen code (session expiry) navigate. Attached in RootNavigator. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Clears the whole stack and shows Welcome, e.g. after the session was refused. */
export function resetToWelcome(): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  }
}
