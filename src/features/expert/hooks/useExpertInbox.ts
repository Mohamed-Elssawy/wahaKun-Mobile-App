import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';

import { describeError } from '@/features/reports/errors';
import type { ReportError } from '@/features/reports/errors';
import { CONFIDENCE_THRESHOLD, expertCtaFor } from '@/features/reports/lifecycle';
import type { ExpertCta, LifecycleStatus } from '@/features/reports/lifecycle';
import { describeSeverity } from '@/features/reports/severity';
import type { SeverityTier } from '@/features/reports/severity';

import { expertApi } from '../services';

import type { ExpertCaseSummary, ExpertFilterChip } from '../types';

const LOAD_ERROR = 'تعذر تحميل الحالات، حاول مرة أخرى';

/** §8.3's tabs. مجدول/جديد are kept masculine-free here; `display.ts`-style labels live in
 * the component, same split the farmer side keeps between status and copy. */
export type ExpertTab = 'all' | 'new' | 'underReview' | 'scheduled' | 'resolved';

type SectionKey = Exclude<ExpertTab, 'all'>;

export type ExpertCaseRow = { summary: ExpertCaseSummary; cta: ExpertCta };

/** `data`, not `rows`: SectionList reads that key by default, same as `useMyReports`' sections. */
export type ExpertInboxSection = {
  key: SectionKey;
  title: string;
  data: ExpertCaseRow[];
};

/** Reopened groups into the same new-review section its chip calls out, not a fifth bucket. */
const TAB_FOR_STATUS: Record<LifecycleStatus, SectionKey> = {
  New: 'new',
  Reopened: 'new',
  UnderReview: 'underReview',
  Scheduled: 'scheduled',
  Resolved: 'resolved',
  AdminClosed: 'resolved',
};

const SECTION_TITLE: Record<SectionKey, string> = {
  new: 'مشاكل جديدة تحتاج مراجعة',
  underReview: 'مشاكل قيد المراجعة',
  scheduled: 'مشاكل مجدولة',
  resolved: 'مشاكل تم حلها',
};

const SECTION_ORDER: readonly SectionKey[] = [
  'new',
  'underReview',
  'scheduled',
  'resolved',
];

// Worst first: the only ترتيب mode §8.3 draws.
const SEVERITY_RANK: Record<SeverityTier, number> = {
  critical: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

/** §8.3's E-01. Loads this expert's assigned cases, sorts, filters and sections them, and
 * resolves each card's CTA through `expertCtaFor` - no screen may branch on status itself. */
export function useExpertInbox() {
  const [cases, setCases] = useState<ExpertCaseSummary[]>([]);
  const [error, setError] = useState<ReportError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<ExpertTab>('all');
  const [filters, setFilters] = useState<readonly ExpertFilterChip[]>([]);
  const isFocused = useRef(true);

  const load = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const result = await expertApi.getAssignedCases();
      if (isFocused.current) {
        setCases(result);
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

  const toggleFilter = useCallback((filter: ExpertFilterChip) => {
    setFilters(current =>
      current.includes(filter) ? current.filter(f => f !== filter) : [...current, filter],
    );
  }, []);

  // §10.2: the chips union rather than replace, same contract as F-01's severity row.
  const matchesFilters = useCallback(
    (summary: ExpertCaseSummary): boolean => {
      if (filters.length === 0) {
        return true;
      }

      const tier = describeSeverity(summary.severity).tier;
      return filters.some(filter =>
        filter === 'lowConfidence'
          ? summary.confidence < CONFIDENCE_THRESHOLD
          : filter === tier,
      );
    },
    [filters],
  );

  const sections = useMemo<ExpertInboxSection[]>(() => {
    const sorted = [...cases].filter(matchesFilters).sort((a, b) => {
      const rankDiff =
        SEVERITY_RANK[describeSeverity(a.severity).tier] -
        SEVERITY_RANK[describeSeverity(b.severity).tier];
      // Least-confident first within a tier, so the amber chip surfaces near the top.
      return rankDiff !== 0 ? rankDiff : a.confidence - b.confidence;
    });

    return SECTION_ORDER.filter(key => tab === 'all' || tab === key)
      .map(key => ({
        key,
        title: SECTION_TITLE[key],
        data: sorted
          .filter(summary => TAB_FOR_STATUS[summary.status] === key)
          .map(summary => ({ summary, cta: expertCtaFor(summary) })),
      }))
      .filter(section => section.data.length > 0);
  }, [cases, tab, matchesFilters]);

  return {
    sections,
    isEmpty: sections.length === 0,
    isLoading,
    error,
    tab,
    setTab,
    filters,
    toggleFilter,
    refresh: load,
  };
}
