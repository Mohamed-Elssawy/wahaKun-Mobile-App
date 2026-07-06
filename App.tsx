import BootSplash from 'react-native-bootsplash';
import { useEffect } from 'react';
import AppNavigator from './navigation/appNavigator';
const App = () => {
  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);
  return <AppNavigator />;
};

export default App;
