/** Import expertApi from here, never the two implementations, so the flag is the switch. */
import { USE_MOCK_EXPERT_QUEUE } from '@/config/env';

import * as real from './expertService';
import * as mock from './expertService.mock';

import type { ExpertApi } from '../types';

export const expertApi: ExpertApi = USE_MOCK_EXPERT_QUEUE ? mock : real;
