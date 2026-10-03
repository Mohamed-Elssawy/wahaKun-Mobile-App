/** Import reportApi from here, never the two implementations, so the flag is the switch. */
// The ReportApi annotation is load-bearing: it stops the mock drifting from the real one.
import { USE_MOCK_REPORTS, USE_MOCK_TRACKER } from '@/config/env';

import * as real from './reportService';
import * as mock from './reportService.mock';
import * as trackerMock from './reportTracker.mock';

import type { ReportApi } from '../types';

const base = USE_MOCK_REPORTS ? mock : real;
// Its own flag: the tracker has no real endpoint at all yet, independent of whether
// analyze/create/getMyReports are already real.
const tracker = USE_MOCK_TRACKER ? trackerMock : real;

export const reportApi: ReportApi = {
  ...base,
  getReportTracker: tracker.getReportTracker,
  confirmResolution: tracker.confirmResolution,
  rejectResolution: tracker.rejectResolution,
};

export { buildAnalyzeFormData } from './reportService';
