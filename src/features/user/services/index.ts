/** Import userApi from here so the flag is the switch; the UserApi type stops drift. */
import { USE_MOCK_USER } from '@/config/env';

import { userApi as real } from './userService';
import { userApi as mock } from './userService.mock';

import type { UserApi } from '../types';

export const userApi: UserApi = USE_MOCK_USER ? mock : real;

/** Pure, and the same either way: a URL is built from a key, not fetched. */
export { resolveProfilePictureUrl } from './userService';
