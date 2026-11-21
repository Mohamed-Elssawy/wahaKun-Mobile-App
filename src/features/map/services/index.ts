/** Import mapApi from here so the flag is the switch; the MapApi type stops the two drifting. */
import { USE_MOCK_MAP } from '@/config/env';

import { mapApi as real } from './mapService';
import { mapApi as mock } from './mapService.mock';

import type { MapApi } from '../types';

export const mapApi: MapApi = USE_MOCK_MAP ? mock : real;
