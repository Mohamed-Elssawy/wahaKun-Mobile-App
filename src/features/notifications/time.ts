// The three formats S-06's frames draw; today reuses formatRelativeTime verbatim.
import {
  formatCalendarDate,
  formatRelativeTime,
  formatYesterdayAt,
  yesterdayLabel,
} from '@/features/reports/relativeTime';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

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
      return formatYesterdayAt(date);
    case 'lastWeek':
      // Weekday and date, deliberately no time: the الأسبوع الماضي rows never print one.
      return formatCalendarDate(date);
  }
}

const GROUP_ORDER: readonly NotificationGroup[] = ['today', 'yesterday', 'lastWeek'];

/** The last two of E3's seven local tables; yesterday is common.yesterday, shared with E-09. */
const GROUP_LABEL_KEYS = {
  today: 's06.group.today',
  lastWeek: 's06.group.lastWeek',
} as const satisfies Record<Exclude<NotificationGroup, 'yesterday'>, TranslationKey>;

function groupLabel(group: NotificationGroup): string {
  return group === 'yesterday' ? yesterdayLabel() : t(GROUP_LABEL_KEYS[group]);
}

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
    title: groupLabel(group),
    data: buckets[group],
  }));
}
