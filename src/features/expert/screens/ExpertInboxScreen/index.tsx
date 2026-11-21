import { useNavigation } from '@react-navigation/native';
import { Inbox } from 'lucide-react-native';
import { useCallback } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import {
  AppHeader,
  EmptyState,
  ProgressRing,
  SegmentedTabs,
  StaleBanner,
  Text,
} from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import type { ExpertCta } from '@/features/reports/lifecycle';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { colors, screenPadding, spacing } from '@/theme';

import { ExpertCaseCard } from '../../components/ExpertCaseCard';
import { ExpertChipRow } from '../../components/ExpertChipRow';
import { useExpertInbox } from '../../hooks/useExpertInbox';
import { navigateToExpertCta } from '../../navigateToCta';

import type { ExpertCaseRow, ExpertTab } from '../../hooks/useExpertInbox';

/** labelKey rides on the item and resolves at render, not here, so the module-scope table can't freeze the boot locale (§16.2). */
const TABS = [
  { key: 'all', labelKey: 'f07.tab.all' },
  { key: 'new', labelKey: 'status.new' },
  { key: 'underReview', labelKey: 'status.underReview' },
  { key: 'scheduled', labelKey: 'status.scheduled' },
  { key: 'resolved', labelKey: 'status.resolved' },
] as const satisfies readonly { key: ExpertTab; labelKey: TranslationKey }[];

/** E-01's triage queue, grouped by status, with the CTA always from expertCtaFor. */
export default function ExpertInboxScreen() {
  const navigation = useNavigation();
  const { avatarUrl } = useIdentity();
  const {
    sections,
    isEmpty,
    hasData,
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
      navigateToExpertCta(navigation, summary.reportId, cta);
    },
    [navigation],
  );

  const handleReschedule = useCallback(
    (reportId: string) => {
      navigation.navigate('ExpertSchedule', { reportId });
    },
    [navigation],
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centred}>
          <ProgressRing />
        </View>
      );
    }

    // An error with nothing cached is a hard failure; with cached cases it is D-STALE and they stay.
    if (error && !hasData) {
      return (
        <ReportErrorView
          error={error}
          unknownTitle={t('e01.loadErrorTitle')}
          onRetry={refresh}
        />
      );
    }

    return (
      <>
        {error ? <StaleBanner message={t('e01.staleBanner')} onRetry={refresh} /> : null}

        {isEmpty ? (
          <EmptyState
            icon={Inbox}
            title={t('e01.emptyTitle')}
            message={t('e01.emptyBody')}
          />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={row => row.summary.reportId}
            renderItem={({ item }: { item: ExpertCaseRow }) => (
              <ExpertCaseCard
                summary={item.summary}
                cta={item.cta}
                onPrimary={cta => handlePrimary(item.summary, cta)}
                onReschedule={() => handleReschedule(item.summary.reportId)}
              />
            )}
            renderSectionHeader={({ section }) => (
              <Text variant="h5" color="textSecondary">
                {section.title}
              </Text>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title={t('tabs.inbox')}
        avatarUrl={avatarUrl}
        onOpenProfile={() => navigation.navigate('Profile')}
        onOpenNotifications={() => navigation.navigate('Notifications')}
      />

      <SegmentedTabs
        items={TABS.map(item => ({ key: item.key, label: t(item.labelKey) }))}
        value={tab}
        onChange={setTab}
      />

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
