import { useNavigation } from '@react-navigation/native';
import { FileSearch } from 'lucide-react-native';
import { useCallback } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import {
  AppHeader,
  EmptyState,
  ListSkeleton,
  SegmentedTabs,
  Text,
} from '@/components/ui';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { colors, roleVariants, screenPadding, spacing } from '@/theme';

import { FilledFilesIcon } from '../../components/FilledFilesIcon';
import { QueueBanner } from '../../components/QueueBanner';
import { QueuedReportRow } from '../../components/QueuedReportRow';
import { ReportCtaCard } from '../../components/ReportCtaCard';
import { ReportErrorView } from '../../components/ReportErrorView';
import { ReportRow } from '../../components/ReportRow';
import { useMyReports } from '../../hooks/useMyReports';
import { REPORT_FILTER_LABELS } from '../../lifecycle/display';

import type { ReportFilter } from '../../hooks/useMyReports';
import type { ReportListItem } from '../../types';

// Only two tabs carry a count in the frame, and a count on all four reads as a dashboard.
const TABS: { key: ReportFilter; labelKey: TranslationKey; showCount: boolean }[] = [
  { key: 'all', labelKey: REPORT_FILTER_LABELS.all, showCount: false },
  { key: 'active', labelKey: REPORT_FILTER_LABELS.active, showCount: true },
  { key: 'resolved', labelKey: REPORT_FILTER_LABELS.resolved, showCount: true },
  { key: 'critical', labelKey: REPORT_FILTER_LABELS.critical, showCount: false },
];

/** F-07. X-07, never having filed one, reads differently to X-06, no match. */
export default function MyReportsScreen() {
  const navigation = useNavigation();
  const { avatarUrl } = useIdentity();
  const {
    sections,
    trackers,
    isEmpty,
    hasAnyReports,
    counts,
    filter,
    setFilter,
    isLoading,
    error,
    hasLastUpdate,
    refresh,
    retryQueued,
    discardQueued,
    unreadReportIds,
    markReportSeen,
  } = useMyReports();

  // D-QUEUE's unread-result opens the result, not the tracker, and reading it clears the marker.
  const openReport = useCallback(
    (reportId: string) => {
      if (unreadReportIds.has(reportId)) {
        markReportSeen(reportId);
        navigation.navigate('ReportDiagnosis', { reportId });
        return;
      }
      navigation.navigate('ReportTracker', { reportId });
    },
    [navigation, unreadReportIds, markReportSeen],
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
        <ReportRow
          report={item.report}
          onPress={openReport}
          trackerDetails={trackers[item.report.id]}
          onResolutionChanged={refresh}
          isUnread={unreadReportIds.has(item.report.id)}
        />
      ),
    [openReport, retryQueued, discardQueued, trackers, refresh, unreadReportIds],
  );

  const renderBody = () => {
    // First load only: a focus refetch leaves the current list on screen.
    if (isLoading) {
      return (
        <View style={styles.list}>
          <ListSkeleton />
        </View>
      );
    }

    // W8: a failed refresh only replaces the list when there's no list to keep, so the queued banner stays visible.
    if (error && !hasAnyReports) {
      return (
        <ReportErrorView
          error={error}
          unknownTitle={t('f07.loadErrorTitle')}
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
            <EmptyState
              icon={FileSearch}
              title={t('f07.noResultsTitle')}
              message={t('f07.noResultsBody')}
            />
          ) : (
            <EmptyState
              icon={FilledFilesIcon}
              title={t('f07.firstUseTitle')}
              message={t('f07.firstUseBody')}
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
          <Text variant={roleVariants.sectionHeader} color="textSecondary">
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
      <AppHeader
        title={t('tabs.myReports')}
        avatarUrl={avatarUrl}
        onOpenProfile={() => navigation.navigate('Profile')}
        onOpenNotifications={() => navigation.navigate('Notifications')}
      />

      <QueueBanner showsLastUpdate={hasLastUpdate} />

      <SegmentedTabs
        items={TABS.map(tab => ({
          key: tab.key,
          // C65: no counts before a first report — "(0)" would just repeat the empty-state copy.
          label:
            tab.showCount && hasAnyReports
              ? `${t(tab.labelKey)} (${counts[tab.key]})`
              : t(tab.labelKey),
        }))}
        value={filter}
        onChange={setFilter}
      />

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
});
