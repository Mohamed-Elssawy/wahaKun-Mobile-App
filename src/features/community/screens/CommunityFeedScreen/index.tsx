import { useNavigation } from '@react-navigation/native';
import { Users } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AppHeader } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportsEmptyState } from '@/features/reports/components/ReportsEmptyState';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { colors, screenPadding, spacing } from '@/theme';

import { FeedChipRow } from '../../components/FeedChipRow';
import { FeedPostCard } from '../../components/FeedPostCard';
import { FeedSortSheet } from '../../components/FeedSortSheet';
import { FeedStatusTabs } from '../../components/FeedStatusTabs';
import { useCommunityFeed } from '../../hooks/useCommunityFeed';

import type { FeedPost, FeedSort } from '../../types';

const TITLE = 'المجتمع';

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
    confirm,
    share,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
    retry,
    isEmpty,
    isFiltered,
    origin,
  } = useCommunityFeed();

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
    if (error) {
      return (
        <View style={styles.fallback}>
          <ReportErrorView
            error={error}
            unknownTitle="تعذر تحميل المجتمع"
            onRetry={retry}
          />
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.fallback}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (isEmpty) {
      const copy = isFiltered ? EMPTY.filtered : EMPTY.all;
      return (
        <View style={styles.fallback}>
          <ReportsEmptyState icon={Users} title={copy.title} message={copy.message} />
        </View>
      );
    }

    return (
      <FlatList
        data={posts}
        keyExtractor={post => post.issueId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        // Half a screen: Arabic cards are tall, so a smaller value never fires.
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : null
        }
      />
    );
  };

  return (
    <View style={styles.screen}>
      {/* No location prop: F-01 has no region line under the bar, unlike F-05 and F-07. */}
      <AppHeader
        title={TITLE}
        avatarUrl={avatarUrl}
        onOpenProfile={() => navigation.navigate('Profile')}
      />

      <FeedStatusTabs tab={tab} onChange={changeTab} />

      <FeedChipRow
        sort={sort}
        severities={severities}
        nearbyOnly={nearbyOnly}
        onOpenSort={() => setIsSortOpen(true)}
        onToggleNearby={toggleNearby}
        onToggleSeverity={toggleSeverity}
      />

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
  list: {
    paddingHorizontal: screenPadding,
    // 12 to clear the chip row's divider, which the frame measures separately from the 16
    // between cards.
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
