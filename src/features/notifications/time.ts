// The three formats S-06's frames draw; today reuses formatRelativeTime verbatim.
import { formatRelativeTime, MONTHS, WEEKDAYS } from '@/features/reports/relativeTime';

import type { NotificationItem } from './types';

export type NotificationGroup = 'today' | 'yesterday' | 'lastWeek';

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar-day difference, not elapsed hours. lastWeek is the open-ended trailing bucket. */
export function groupFor(iso: string, now: Date = new Date()): NotificationGroup {
  const diffDays = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY_MS);

  if (diffDays <= 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  return 'lastWeek';
}

/** 12-hour with no leading zero, and no weekday or month: the frame draws no date here. */
function formatYesterday(date: Date): string {
  const hour24 = date.getHours();
  const period = hour24 < 12 ? 'ص' : 'م';
  const hour12 = hour24 % 12 || 12;
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `أمس، ${hour12}:${minute} ${period}`;
}

/** Weekday and date, deliberately no time: the الأسبوع الماضي rows never print one. */
function formatLastWeek(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}، ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Picked by the same calendar-day grouping as the section header, so the two cannot disagree. */
export function formatNotificationTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  switch (groupFor(iso, now)) {
    case 'today':
      return formatRelativeTime(iso, now);
    case 'yesterday':
      return formatYesterday(date);
    case 'lastWeek':
      return formatLastWeek(date);
  }
}

const GROUP_ORDER: readonly NotificationGroup[] = ['today', 'yesterday', 'lastWeek'];

const GROUP_LABEL: Record<NotificationGroup, string> = {
  today: 'اليوم',
  yesterday: 'أمس',
  lastWeek: 'الأسبوع الماضي',
};

export type NotificationSection = {
  group: NotificationGroup;
  title: string;
  data: NotificationItem[];
};

/** Drops an empty group, so no bare header draws between يوم and الأسبوع الماضي. */
export function groupNotifications(
  items: readonly NotificationItem[],
  now: Date = new Date(),
): NotificationSection[] {
  const buckets: Record<NotificationGroup, NotificationItem[]> = {
    today: [],
    yesterday: [],
    lastWeek: [],
  };

  for (const item of items) {
    buckets[groupFor(item.createdAt, now)].push(item);
  }

  return GROUP_ORDER.filter(group => buckets[group].length > 0).map(group => ({
    group,
    title: GROUP_LABEL[group],
    data: buckets[group],
  }));
}
