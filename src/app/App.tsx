import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getAccessToken } from '@/api';
import { RegistrationProvider } from '@/features/onboarding/context/RegistrationContext';
import { hasSeenIntro } from '@/features/onboarding/services/firstRunStore';
import { startReportQueue } from '@/features/reports/services/reportQueue';
import { RootNavigator } from '@/navigation/RootNavigator';
import type { BootRoute } from '@/navigation/types';

/** A stored session boots straight to Home; otherwise first-run decides intro vs welcome. */
async function resolveBootRoute(): Promise<BootRoute> {
  if (await getAccessToken()) {
    return 'Home';
  }
  return (await hasSeenIntro()) ? 'Welcome' : 'IntroSlideshow';
}

/** Both providers are mounted once here; a second one mid-tree breaks insets and gestures. */
const App = () => {
  const [bootRoute, setBootRoute] = useState<BootRoute | null>(null);

  useEffect(() => {
    // The splash stays up until the route is decided, so the wrong first screen never flashes.
    resolveBootRoute()
      .then(setBootRoute)
      // A failed read must still boot the app, or it hangs on a blank screen after the splash.
      .catch(() => setBootRoute('Welcome'))
      .finally(() => BootSplash.hide({ fade: true }));

    // Queued reports must upload whether or not the farmer opens the tab showing them.
    startReportQueue();
  }, []);

  if (!bootRoute) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <RegistrationProvider>
          <RootNavigator initialRouteName={bootRoute} />
        </RegistrationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
