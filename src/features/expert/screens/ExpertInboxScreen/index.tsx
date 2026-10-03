import { useNavigation } from '@react-navigation/native';
import { Inbox } from 'lucide-react-native';
import { useCallback } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import {
  AppHeader,
  EmptyState,
  ProgressRing,
  SegmentedTabs,
  Text,
} from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import type { ExpertCta } from '@/features/reports/lifecycle';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { colors, screenPadding, spacing } from '@/theme';

import { ExpertCaseCard } from '../../components/ExpertCaseCard';
import { ExpertChipRow } from '../../components/ExpertChipRow';
import { useExpertInbox } from '../../hooks/useExpertInbox';

import type { ExpertCaseRow, ExpertTab } from '../../hooks/useExpertInbox';

const TITLE = 'الوارد';

const TABS: { key: ExpertTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'new', label: 'جديدة' },
  { key: 'underReview', label: 'قيد المراجعة' },
  { key: 'scheduled', label: 'مجدولة' },
  { key: 'resolved', label: 'تم الحل' },
];

/** E-01. The triage queue: both axes on one card, grouped by status, CTA always from
 * `expertCtaFor`. Reassignment, decline and availability have no control anywhere here. */
export default function ExpertInboxScreen() {
  const navigation = useNavigation();
  const { avatarUrl, location } = useIdentity();
  const {
    sections,
    isEmpty,
    isLoading,
    error,
    tab,
    setTab,
    filters,
    toggleFilter,
    refresh,
  } = useExpertInbox();

  const handlePrimary = useCallback(
    (summary: ExpertCaseRow['summary'], cta: ExpertCta) => {
      if (cta.screen === 'E-02') {
        navigation.navigate('ExpertCaseReview', {
          reportId: summary.reportId,
          state: cta.state,
        });
        return;
      }
      // E-03 - E-06 are a later unit; nothing crashes, nothing pretends to work.
      // TODO(expert-queue): wire once those screens exist.
    },
    [navigation],
  );

  const handleReschedule = useCallback(() => {
    // TODO(reschedule): §8.3's state:reschedule is registered but not designed yet.
  }, []);

  const renderBody = () => {
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
          unknownTitle="تعذر تحميل الحالات"
          onRetry={refresh}
        />
      );
    }

    if (isEmpty) {
      return (
        <EmptyState
          icon={Inbox}
          title="لا توجد حالات في الوارد"
          message="الحالات المسندة إليك ستظهر هنا."
        />
      );
    }

    return (
      <SectionList
        sections={sections}
        keyExtractor={row => row.summary.reportId}
        renderItem={({ item }: { item: ExpertCaseRow }) => (
          <ExpertCaseCard
            summary={item.summary}
            cta={item.cta}
            onPrimary={cta => handlePrimary(item.summary, cta)}
            onReschedule={handleReschedule}
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text variant="label14Bold" color="textSecondary" align="right">
            {section.title}
          </Text>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title={TITLE}
        avatarUrl={avatarUrl}
        location={location}
        onOpenProfile={() => navigation.navigate('Profile')}
      />

      <SegmentedTabs items={TABS} value={tab} onChange={setTab} />

      <ExpertChipRow filters={filters} onToggleFilter={toggleFilter} />

      <View style={styles.body}>{renderBody()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  list: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[16],
    paddingBottom: spacing[32],
    gap: spacing[16],
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
