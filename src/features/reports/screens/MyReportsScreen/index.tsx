import { useNavigation } from '@react-navigation/native';
import { FileSearch, FileText } from 'lucide-react-native';
import { useCallback } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, screenPadding, spacing } from '@/theme';

import { ProgressRing } from '../../components/ProgressRing';
import { QueueBanner } from '../../components/QueueBanner';
import { QueuedReportRow } from '../../components/QueuedReportRow';
import { ReportCtaCard } from '../../components/ReportCtaCard';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportFilterTabs } from '../../components/ReportFilterTabs';
import { ReportHeader } from '../../components/ReportHeader';
import { ReportRow } from '../../components/ReportRow';
import { ReportsEmptyState } from '../../components/ReportsEmptyState';
import { useMyReports } from '../../hooks/useMyReports';

import type { ReportListItem } from '../../types';

const TITLE = 'بلاغاتي';

/** F-07. The empty state splits: never filed one (X-07) reads differently to no match (X-06). */
// The frame's tracker, expert and appointment data has no endpoint, so it is left out.
export default function MyReportsScreen() {
  const navigation = useNavigation();
  const {
    sections,
    isEmpty,
    hasAnyReports,
    counts,
    filter,
    setFilter,
    isLoading,
    error,
    refresh,
    retryQueued,
    discardQueued,
  } = useMyReports();

  const openReport = useCallback(
    (reportId: string) => navigation.navigate('IssueDetails', { reportId }),
    [navigation],
  );

  const startReport = useCallback(
    () => navigation.navigate('ReportCapture'),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ReportListItem }) =>
      item.kind === 'queued' ? (
        <QueuedReportRow
          report={item.queued}
          onRetry={retryQueued}
          onDiscard={discardQueued}
        />
      ) : (
        <ReportRow report={item.report} onPress={openReport} />
      ),
    [openReport, retryQueued, discardQueued],
  );

  const renderBody = () => {
    // First load only: a focus refetch leaves the current list on screen.
    if (isLoading) {
      return (
        <View style={styles.centred}>
          <ProgressRing />
        </View>
      );
    }

    if (error) {
      return (
        <ReportErrorView
          error={error}
          unknownTitle="تعذر تحميل البلاغات"
          onRetry={refresh}
        />
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.empty}>
          <ReportCtaCard onPress={startReport} />

          {/* The card above is the way out, so neither empty state carries a button. */}
          {hasAnyReports ? (
            <ReportsEmptyState
              icon={FileSearch}
              title="لا توجد بلاغات مطابقة"
              message="جرّب توسيع البحث أو تغيير الفلتر."
            />
          ) : (
            <ReportsEmptyState
              icon={FileText}
              title="لم تُبلّغ عن أي مشكلة بعد"
              message="عندما تبلغ عن مشكلة، ستظهر هنا حتى تتمكن من تتبع حالتها."
            />
          )}
        </View>
      );
    }

    return (
      <SectionList
        sections={sections}
        renderItem={renderItem}
        keyExtractor={item =>
          item.kind === 'queued' ? item.queued.localId : item.report.id
        }
        renderSectionHeader={({ section }) => (
          <Text variant="label14Bold" color="textSecondary" align="right">
            {section.title}
          </Text>
        )}
        ListHeaderComponent={<ReportCtaCard onPress={startReport} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        // The headers are copy, not navigation, and pinning them would cover a card.
        stickySectionHeadersEnabled={false}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <ReportHeader title={TITLE} />

      <QueueBanner />

      <ReportFilterTabs filter={filter} counts={counts} onChange={setFilter} />

      <View style={styles.body}>{renderBody()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  // gap, not a separator: it also has to space rows from the section header.
  list: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[16],
    paddingBottom: spacing[32],
    gap: spacing[16],
  },
  empty: {
    flex: 1,
    paddingHorizontal: screenPadding,
    paddingTop: spacing[16],
    gap: spacing[16],
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[24],
    paddingHorizontal: screenPadding,
  },
});
