/** Import communityApi from here, never the two implementations, so the flag is the switch. */
// The CommunityApi annotation is load-bearing: it stops the mock drifting from the real one.
import { USE_MOCK_COMMUNITY } from '@/config/env';

import { communityApi as real } from './communityService';
import { communityApi as mock } from './communityService.mock';

import type { CommunityApi } from '../types';

export const communityApi: CommunityApi = USE_MOCK_COMMUNITY ? mock : real;
