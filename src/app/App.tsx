import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  onSessionExpired,
  refreshSessionOutcome,
} from '@/api';
import { RegistrationProvider } from '@/features/onboarding/context/RegistrationContext';
import { startReportQueue } from '@/features/reports/services/reportQueue';
import { resetToWelcome } from '@/navigation/navigationRef';
import { RootNavigator } from '@/navigation/RootNavigator';
import type { BootRoute } from '@/navigation/types';

/**
 * Welcome is the first screen of a fresh install. Set to true to show the three-slide intro
 * before it instead (it then marks itself seen and resets to Welcome).
 */
const SHOW_INTRO_ON_FIRST_LAUNCH = false;

/** Home only for a session that is still usable; anything else starts at Welcome. */
async function resolveBootRoute(): Promise<BootRoute> {
  const accessToken = await getAccessToken();

  if (accessToken) {
    if (!isTokenExpired(accessToken)) {
      return 'Home';
    }

    // Expired access token: try the refresh token before deciding.
    if (await getRefreshToken()) {
      const outcome = await refreshSessionOutcome();
      // Offline at launch: keep the farmer signed in so queued reports still upload later.
      if (outcome === 'refreshed' || outcome === 'network') {
        return 'Home';
      }
    }

    // Refused or missing refresh token: this session is over.
    await clearTokens();
  }

  if (SHOW_INTRO_ON_FIRST_LAUNCH && !(await hasSeenIntro())) {
    return 'IntroSlideshow';
  }
  return 'Welcome';
}

/** Both providers are mounted once here; a second one mid-tree breaks insets and gestures. */
const App = () => {
  const [bootRoute, setBootRoute] = useState<BootDecision | null>(null);

  useEffect(() => {
    // The splash stays up until the route is decided, so the wrong first screen never flashes.
    resolveBootDecision()
      .then(setBootRoute)
      // A failed read must still boot the app, or it hangs on a blank screen after the splash.
      // resolveBootDecision already answers X-01 for a failed session check; this is the rest.
      .catch(() => setBootRoute({ name: 'Welcome' }))
      .finally(() => BootSplash.hide({ fade: true }));

    // Queued reports must upload whether or not the farmer opens the tab showing them.
    startReportQueue();

    // The API client ends the session when the server refuses the refresh token.
    return onSessionExpired(resetToWelcome);
  }, []);

  if (!bootRoute) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <RegistrationProvider>
          <RootNavigator initialRoute={bootRoute} />
        </RegistrationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
