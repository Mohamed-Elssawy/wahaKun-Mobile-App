// NotificationService has no route anywhere, so there is nothing to seed from.
import { emptyOnEmptyScenario, failOnErrorScenario, mockDelay } from '@/api/mockScenario';
import { resolveRole } from '@/features/user/role';

import { SEED_NOTIFICATIONS_EXPERT, SEED_NOTIFICATIONS_FARMER } from '../fixtures';

import type { NotificationApi, NotificationItem, NotificationPage } from '../types';

const LATENCY = 500;
const LIST_ERROR = 'تعذر تحميل الإشعارات';
const WRITE_ERROR = 'تعذر إتمام العملية';

// Module scope, not a hook: a read has to survive leaving the screen, the way the server's would.
const farmerNotifications = SEED_NOTIFICATIONS_FARMER.map(item => ({ ...item }));
const expertNotifications = SEED_NOTIFICATIONS_EXPERT.map(item => ({ ...item }));

function currentList(): NotificationItem[] {
  return resolveRole(null).role === 'expert' ? expertNotifications : farmerNotifications;
}

export async function getNotifications(
  page: number,
  pageSize: number,
): Promise<NotificationPage> {
  await mockDelay(LATENCY);
  failOnErrorScenario(LIST_ERROR);

  const all = emptyOnEmptyScenario(currentList());
  const start = (page - 1) * pageSize;
  const slice = all.slice(start, start + pageSize);

  return { items: [...slice], hasMore: start + slice.length < all.length };
}

export async function markRead(id: string): Promise<void> {
  await mockDelay(LATENCY);
  failOnErrorScenario(WRITE_ERROR);

  const notification = currentList().find(item => item.id === id);
  if (notification) {
    notification.isRead = true;
  }
}

export async function markAllRead(): Promise<void> {
  await mockDelay(LATENCY);
  failOnErrorScenario(WRITE_ERROR);

  for (const notification of currentList()) {
    notification.isRead = true;
  }
}

export const notificationApi: NotificationApi = {
  getNotifications,
  markRead,
  markAllRead,
};
