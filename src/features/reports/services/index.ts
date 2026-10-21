/** Import reportApi from here so the flag is the switch; the ReportApi type stops drift. */
import { USE_MOCK_REPORTS, USE_MOCK_TRACKER } from '@/config/env';

import * as real from './reportService';
import * as mock from './reportService.mock';
import * as trackerMock from './reportTracker.mock';

import type { ReportApi } from '../types';

const base = USE_MOCK_REPORTS ? mock : real;
// Its own flag: the tracker's endpoint is independent of analyze, create and getMyReports.
const tracker = USE_MOCK_TRACKER ? trackerMock : real;

export const reportApi: ReportApi = {
  ...base,
  getReportTracker: tracker.getReportTracker,
  confirmResolution: tracker.confirmResolution,
  rejectResolution: tracker.rejectResolution,
};

export { buildAnalyzeFormData } from './reportService';
