import { useNavigation } from '@react-navigation/native';
import { Users } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import {
  AppHeader,
  EmptyState,
  ListSkeleton,
  SegmentedTabs,
  StaleBanner,
  Text,
} from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { colors, radii, screenPadding, shadows, spacing } from '@/theme';

import { FeedChipRow } from '../../components/FeedChipRow';
import { FeedPostCard } from '../../components/FeedPostCard';
import { FeedSortSheet } from '../../components/FeedSortSheet';
import { useCommunityFeed } from '../../hooks/useCommunityFeed';

import type { FeedPost, FeedSort, FeedTab } from '../../types';

// All three fit at the widest Arabic label, so this row does not scroll; the severity chips do.
const TABS: { key: FeedTab; labelKey: TranslationKey }[] = [
  { key: 'all', labelKey: 'f07.tab.all' },
  { key: 'active', labelKey: 'f07.tab.active' },
  { key: 'resolved', labelKey: 'status.resolved' },
];

const EMPTY = {
  all: {
    title: 'f01.emptyTitle',
    message: 'f01.emptyBody',
  },
  filtered: {
    title: 'f07.noResultsTitle',
    message: 'f07.noResultsBody',
  },
} as const satisfies Record<string, { title: TranslationKey; message: TranslationKey }>;

/** F-01. */
export default function CommunityFeedScreen() {
  const navigation = useNavigation();
  const { avatarUrl } = useIdentity();
  const [isSortOpen, setIsSortOpen] = useState(false);

  const {
    posts,
    tab,
    severities,
    nearbyOnly,
    sort,
    changeTab,
    changeSort,
    toggleNearby,
    toggleSeverity,
    share,
    isLoading,
    isLoadingMore,
    error,
    refresh,
    loadMore,
    isEmpty,
    isFiltered,
    origin,
    toggleConfirmation,
  } = useCommunityFeed();
  const [actionError, setActionError] = useState('');

  const confirm = async (issueId: string): Promise<void> => {
    setActionError('');
    const message = await toggleConfirmation(issueId);
    if (message) {
      setActionError(message);
    }
  };

  const openIssue = (issueId: string) =>
    navigation.navigate('IssueDetails', { reportId: issueId });

  const selectSort = (next: FeedSort) => {
    setIsSortOpen(false);
    changeSort(next);
  };

  const renderItem = ({ item }: { item: FeedPost }) => (
    <FeedPostCard
      post={item}
      origin={origin}
      onPress={openIssue}
      onConfirm={confirm}
      onShare={share}
    />
  );

  const renderBody = () => {
    // An error with nothing cached is a hard failure; with posts up it is D-STALE and they stay.
    if (error && posts.length === 0) {
      return (
        <View style={styles.fallback}>
          <ReportErrorView
            error={error}
            unknownTitle={t('f01.loadErrorTitle')}
            onRetry={refresh}
          />
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.list}>
          <ListSkeleton />
        </View>
      );
    }

    const emptyCopy = isFiltered ? EMPTY.filtered : EMPTY.all;

    return (
      <>
        {error ? <StaleBanner message={t('f01.staleBanner')} onRetry={refresh} /> : null}

        {isEmpty ? (
          <View style={styles.fallback}>
            <EmptyState
              icon={Users}
              title={t(emptyCopy.title)}
              message={t(emptyCopy.message)}
            />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={post => post.issueId}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            // Half a screen: Arabic cards are tall, so a smaller value never fires.
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator color={colors.primary} style={styles.footer} />
              ) : null
            }
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      {/* No location prop: F-01 has no region line under the bar, unlike F-05 and F-07. */}
      <AppHeader
        title={t('tabs.community')}
        avatarUrl={avatarUrl}
        onOpenProfile={() => navigation.navigate('Profile')}
        onOpenNotifications={() => navigation.navigate('Notifications')}
      />

      <SegmentedTabs
        items={TABS.map(({ key, labelKey }) => ({ key, label: t(labelKey) }))}
        value={tab}
        onChange={changeTab}
        variant="floating"
      />

      <FeedChipRow
        sort={sort}
        severities={severities}
        nearbyOnly={nearbyOnly}
        onOpenSort={() => setIsSortOpen(true)}
        onToggleNearby={toggleNearby}
        onToggleSeverity={toggleSeverity}
      />

      {/* A failed vote snaps its own count back; this banner is only for a rejected vote's message. */}
      {actionError ? (
        <View style={styles.banner}>
          <Text variant="body14" color="error">
            {actionError}
          </Text>
        </View>
      ) : null}

      {renderBody()}

      <FeedSortSheet
        isVisible={isSortOpen}
        sort={sort}
        onSelect={selectSort}
        onDismiss={() => setIsSortOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    // Above the list so the shadow falls on the cards, as in F-01.
    zIndex: 1,
    ...shadows.card,
  },
  banner: {
    marginHorizontal: screenPadding,
    marginTop: spacing[12],
    padding: spacing[12],
    borderRadius: radii[12],
    backgroundColor: colors.errorTint,
  },
  list: {
    paddingHorizontal: screenPadding,
    // 12 clears the chip row's divider, which the frame measures apart from the 16 between cards.
    paddingTop: spacing[12],
    paddingBottom: spacing[24],
    gap: spacing[16],
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: spacing[16],
  },
});
