import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RegistrationProvider } from '@/features/onboarding/context/RegistrationContext';
import { hasSeenIntro } from '@/features/onboarding/services/firstRunStore';
import { startReportQueue } from '@/features/reports/services/reportQueue';
import { RootNavigator } from '@/navigation/RootNavigator';
import type { BootRoute } from '@/navigation/types';

/** Both providers are mounted once here; a second one mid-tree breaks insets and gestures. */
const App = () => {
  const [bootRoute, setBootRoute] = useState<BootRoute | null>(null);

  useEffect(() => {
    // The splash stays up until the flag is read, so the wrong first screen never flashes.
    hasSeenIntro()
      .then(seen => setBootRoute(seen ? 'Welcome' : 'IntroSlideshow'))
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
