import { useNavigation } from '@react-navigation/native';

import { resolveBootDecision } from './bootRoute';

/**
 * §4.1 is taken at S-01 and after every successful authentication, so the login screens send
 * the account through the same decision the boot path uses rather than straight to Home.
 */
export function useRouteAfterLogin() {
  const navigation = useNavigation();

  // reset, not navigate, so login does not stay on the back stack.
  return async () => {
    const decision = await resolveBootDecision();

    navigation.reset({ index: 0, routes: [decision] });
  };
}
