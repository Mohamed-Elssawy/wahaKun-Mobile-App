import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onSessionExpired } from '@/api';
import { RegistrationProvider } from '@/features/onboarding/context/RegistrationContext';
import { startReportQueue } from '@/features/reports/services/reportQueue';
import { resolveBootDecision } from '@/navigation/bootRoute';
import { resetToWelcome } from '@/navigation/navigationRef';
import { RootNavigator } from '@/navigation/RootNavigator';
import type { BootDecision } from '@/navigation/types';

/** Both providers are mounted once here; a second one mid-tree breaks insets and gestures. */
const App = () => {
  const [bootRoute, setBootRoute] = useState<BootDecision | null>(null);

  useEffect(() => {
    // The splash stays up until the route is decided, so the wrong first screen never flashes.
    resolveBootDecision()
      .then(setBootRoute)
      // A failed read must still boot, or the app hangs on a blank screen after the splash.
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
