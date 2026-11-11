import { useNavigation } from '@react-navigation/native';

import { resolveBootDecision } from './bootRoute';

/** §4.1 is taken after every authentication, so login uses the same decision as boot. */
export function useRouteAfterLogin() {
  const navigation = useNavigation();

  // reset, not navigate, so login does not stay on the back stack.
  return async () => {
    const decision = await resolveBootDecision();

    navigation.reset({ index: 0, routes: [decision] });
  };
}
