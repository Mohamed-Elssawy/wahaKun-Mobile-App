// No NotificationService route exists; see USE_MOCK_NOTIFICATIONS in config/env.

import type { NotificationApi, NotificationPage } from '../types';

const NO_NOTIFICATION_ENDPOINT = 'No notification-facing endpoint exists yet.';

// BACKEND-GAP 30: all three throw until a route exists.
export async function getNotifications(
  _page: number,
  _pageSize: number,
): Promise<NotificationPage> {
  throw new Error(NO_NOTIFICATION_ENDPOINT);
}

export async function markRead(_id: string): Promise<void> {
  throw new Error(NO_NOTIFICATION_ENDPOINT);
}

export async function markAllRead(): Promise<void> {
  throw new Error(NO_NOTIFICATION_ENDPOINT);
}

export const notificationApi: NotificationApi = {
  getNotifications,
  markRead,
  markAllRead,
};
