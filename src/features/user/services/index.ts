/** Import userApi from here, never the two implementations, so the flag is the switch. */
// The UserApi annotation is load-bearing: it stops the mock drifting from the real one.
import { USE_MOCK_USER } from '@/config/env';

import { userApi as real } from './userService';
import { userApi as mock } from './userService.mock';

import type { UserApi } from '../types';

export const userApi: UserApi = USE_MOCK_USER ? mock : real;

/** Pure, and the same either way: a URL is built from a key, not fetched. */
export { resolveProfilePictureUrl } from './userService';
