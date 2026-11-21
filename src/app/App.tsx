import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onSessionExpired } from '@/api';
import { LanguageRelaunch } from '@/components/ui';
import { RegistrationProvider } from '@/features/onboarding/context/RegistrationContext';
import { startReportQueue } from '@/features/reports/services/reportQueue';
import { useRelaunch } from '@/hooks/useRelaunch';
import { resolveLocale } from '@/i18n';
import { resolveBootDecision } from '@/navigation/bootRoute';
import { resetToWelcome } from '@/navigation/navigationRef';
import { RootNavigator } from '@/navigation/RootNavigator';
import type { BootDecision } from '@/navigation/types';

/** Both providers are mounted once here; a second one mid-tree breaks insets and gestures. */
const App = () => {
  const [bootRoute, setBootRoute] = useState<BootDecision | null>(null);
  const relaunch = useRelaunch();

  useEffect(() => {
    // Splash stays up until both are decided, so neither the wrong screen nor the wrong direction ever flashes.
    Promise.all([resolveBootDecision(), resolveLocale()])
      .then(([route]) => setBootRoute(route))
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
          {/* Above the navigator, not inside it - a language change can't render until restart, so replacing the navigator leaves nothing underneath drawing the old locale. */}
          {relaunch.target ? (
            <LanguageRelaunch
              target={relaunch.target}
              failure={relaunch.failure}
              onRestart={relaunch.restart}
            />
          ) : (
            <RootNavigator initialRoute={bootRoute} />
          )}
        </RegistrationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
