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
import { colors, radii, screenPadding, shadows, spacing } from '@/theme';

import { FeedChipRow } from '../../components/FeedChipRow';
import { FeedPostCard } from '../../components/FeedPostCard';
import { FeedSortSheet } from '../../components/FeedSortSheet';
import { useCommunityFeed } from '../../hooks/useCommunityFeed';

import type { FeedPost, FeedSort, FeedTab } from '../../types';

const TITLE = 'المجتمع';

// All three fit at the widest Arabic label, so this row does not scroll; the severity chips do.
const TABS: { key: FeedTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشطة' },
  { key: 'resolved', label: 'تم الحل' },
];

const EMPTY = {
  all: {
    title: 'لا توجد بلاغات بعد',
    message: 'كن أول من يبلغ عن مشكلة في الواحة، وسيظهر بلاغك هنا للجميع.',
  },
  filtered: {
    title: 'لا توجد بلاغات مطابقة',
    message: 'جرّب توسيع البحث أو تغيير الفلتر.',
  },
} as const;

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
            unknownTitle="تعذر تحميل المجتمع"
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
        {error ? (
          <StaleBanner
            message="تعذر تحديث المجتمع، قد تكون البيانات قديمة"
            onRetry={refresh}
          />
        ) : null}

        {isEmpty ? (
          <View style={styles.fallback}>
            <EmptyState
              icon={Users}
              title={emptyCopy.title}
              message={emptyCopy.message}
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
        title={TITLE}
        avatarUrl={avatarUrl}
        onOpenProfile={() => navigation.navigate('Profile')}
        onOpenNotifications={() => navigation.navigate('Notifications')}
      />

      <SegmentedTabs items={TABS} value={tab} onChange={changeTab} variant="floating" />

      <FeedChipRow
        sort={sort}
        severities={severities}
        nearbyOnly={nearbyOnly}
        onOpenSort={() => setIsSortOpen(true)}
        onToggleNearby={toggleNearby}
        onToggleSeverity={toggleSeverity}
      />

      {/* No error screen for a vote on the card itself: the count snapping back on failure is
          the card's own message. This banner is only for the message a rejected vote carries. */}
      {actionError ? (
        <View style={styles.banner}>
          <Text variant="body14" color="error" align="right">
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
