import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';

import { chatApi } from '../services';

import type { ChatThread } from '../types';

const LOAD_ERROR = 'تعذر تحميل المحادثات، حاول مرة أخرى';

export type ExpertChatFilter = 'unread' | 'active';

/** §8.3's E-09. Loads this expert's threads and filters them; ترتيب has exactly one mode
 * today, same as E-01's chip row, so there is nothing to sort by yet. */
export function useExpertChats() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<readonly ExpertChatFilter[]>([]);
  const isFocused = useRef(true);

  const load = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const result = await chatApi.getThreads();
      if (isFocused.current) {
        setThreads(result);
      }
    } catch (err) {
      if (isFocused.current) {
        setError(describeError(err, LOAD_ERROR));
      }
    } finally {
      if (isFocused.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      load();

      return () => {
        isFocused.current = false;
      };
    }, [load]),
  );

  const toggleFilter = useCallback((filter: ExpertChatFilter) => {
    setFilters(current =>
      current.includes(filter) ? current.filter(f => f !== filter) : [...current, filter],
    );
  }, []);

  // Independent toggles that union, same contract as E-01's severity chips.
  const visible = useMemo(
    () =>
      threads.filter(
        thread =>
          (!filters.includes('unread') || thread.isUnread) &&
          (!filters.includes('active') || thread.isActive),
      ),
    [threads, filters],
  );

  return {
    threads: visible,
    isEmpty: !isLoading && !error && visible.length === 0,
    isLoading,
    error,
    filters,
    toggleFilter,
    refresh: load,
  };
}
