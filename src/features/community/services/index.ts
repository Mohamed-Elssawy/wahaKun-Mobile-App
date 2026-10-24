/** Import communityApi from here so the flag is the switch; the CommunityApi type stops drift. */
import { USE_MOCK_COMMUNITY } from '@/config/env';

import { communityApi as real } from './communityService';
import { communityApi as mock } from './communityService.mock';

import type { CommunityApi } from '../types';

export const communityApi: CommunityApi = USE_MOCK_COMMUNITY ? mock : real;
