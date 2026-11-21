import { APP_URL_SCHEME, RESET_PASSWORD_PATH } from '@/config/env';

import type { RootStackParamList } from './types';
import type { LinkingOptions } from '@react-navigation/native';

/** The emailed reset link is the only route here; its params come off the query string. */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${APP_URL_SCHEME}://`],
  config: {
    screens: {
      ResetPassword: RESET_PASSWORD_PATH,
    },
  },
};
