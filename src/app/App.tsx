import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RegistrationProvider } from '@/features/onboarding/context/RegistrationContext';
import { RootNavigator } from '@/navigation/RootNavigator';

/**
 * Application root: providers, then the navigator.
 *
 * SafeAreaProvider and GestureHandlerRootView are mounted once, here. Both
 * measure or intercept at the tree root, and nesting a second one mid-tree is a
 * known source of inset and gesture bugs — screens use SafeAreaView instead.
 */
const App = () => {
  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <RegistrationProvider>
          <RootNavigator />
        </RegistrationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
