import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';

import { notificationApi } from '../services';

import type { NotificationItem } from '../types';

const LOAD_ERROR = 'تعذر تحميل الإشعارات، حاول مرة أخرى';
const PAGE_SIZE = 10;

/** Owns read state and pagination both: S-06 has one list, so one hook. No refresh (G-NO-PTR). */
export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const page = useRef(1);
  const isFocused = useRef(true);
  const requestId = useRef(0);

  const load = useCallback(async (): Promise<void> => {
    const request = ++requestId.current;
    setError(null);

    try {
      const result = await notificationApi.getNotifications(1, PAGE_SIZE);

      if (!isFocused.current || request !== requestId.current) {
        return;
      }

      page.current = 1;
      setItems(result.items);
      setHasMore(result.hasMore);
    } catch (err) {
      if (isFocused.current && request === requestId.current) {
        setError(describeError(err, LOAD_ERROR));
      }
    } finally {
      if (isFocused.current && request === requestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Refetches on focus: a notification raised elsewhere belongs on the list when the bell is tapped.
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      load();

      return () => {
        isFocused.current = false;
      };
    }, [load]),
  );

  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoadingMore || isLoading || error) {
      return;
    }

    const request = requestId.current;
    setIsLoadingMore(true);

    try {
      const next = page.current + 1;
      const result = await notificationApi.getNotifications(next, PAGE_SIZE);

      if (!isFocused.current || request !== requestId.current) {
        return;
      }

      page.current = next;
      // Deduped by id: a row added between pages would otherwise arrive twice.
      setItems(current => {
        const seen = new Set(current.map(item => item.id));
        return [...current, ...result.items.filter(item => !seen.has(item.id))];
      });
      setHasMore(result.hasMore);
    } catch {
      if (isFocused.current) {
        setHasMore(false);
      }
    } finally {
      if (isFocused.current) {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, isLoading, error]);

  /** Optimistic: the dot clears at once, and a failed markRead is not worth rolling back. */
  const markRead = useCallback(async (id: string): Promise<void> => {
    setItems(current =>
      current.map(item => (item.id === id ? { ...item, isRead: true } : item)),
    );

    try {
      await notificationApi.markRead(id);
    } catch {
      // Silent: see the comment above. The row stays read on screen either way.
    }
  }, []);

  /** Clears every dot, not just اليوم's: تعليم الكل كمقروء names no scope. */
  const markAllRead = useCallback(async (): Promise<void> => {
    setItems(current => current.map(item => ({ ...item, isRead: true })));

    try {
      await notificationApi.markAllRead();
    } catch {
      // Silent, same reasoning as markRead.
    }
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    retry: load,
    loadMore,
    markRead,
    markAllRead,
    isEmpty: !isLoading && !error && items.length === 0,
  };
}
