/** Import notificationApi from here so the flag is the switch; the type annotation stops drift. */
import { USE_MOCK_NOTIFICATIONS } from '@/config/env';

import { notificationApi as real } from './notificationService';
import { notificationApi as mock } from './notificationService.mock';

import type { NotificationApi } from '../types';

export const notificationApi: NotificationApi = USE_MOCK_NOTIFICATIONS ? mock : real;
