/** Import reportApi from here, never the two implementations, so the flag is the switch. */
// The ReportApi annotation is load-bearing: it stops the mock drifting from the real one.
import { USE_MOCK_REPORTS } from '@/config/env';

import * as real from './reportService';
import * as mock from './reportService.mock';

import type { ReportApi } from '../types';

export const reportApi: ReportApi = USE_MOCK_REPORTS ? mock : real;

export { buildCreateReportFormData } from './reportService';
