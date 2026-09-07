import { useNavigation } from '@react-navigation/native';
import { Users } from 'lucide-react-native';
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

import { FeedFilterTabs } from '../../components/FeedFilterTabs';
import { FeedPostCard } from '../../components/FeedPostCard';
import { useCommunityFeed } from '../../hooks/useCommunityFeed';

import type { FeedPost } from '../../types';

const EMPTY = {
  all: {
    title: 'لا توجد بلاغات بعد',
    message: 'كن أول من يبلغ عن مشكلة في الواحة، وسيظهر بلاغك هنا للجميع.',
  },
  filtered: {
    title: 'لا توجد بلاغات مطابقة',
    message: 'جرّب تصنيفًا آخر لعرض بلاغات الواحة.',
  },
} as const;

/** F-01. */
export default function CommunityFeedScreen() {
  const navigation = useNavigation();
  const { displayName: _displayName, avatarUrl, location } = useIdentity();
  const {
    posts,
    filter,
    changeFilter,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    refresh,
    loadMore,
    retry,
    isEmpty,
    origin,
  } = useCommunityFeed();

  const openIssue = (issueId: string) =>
    navigation.navigate('IssueDetails', { reportId: issueId });

  const renderItem = ({ item }: { item: FeedPost }) => (
    <FeedPostCard
      post={item}
      origin={origin}
      onPress={openIssue}
      // Confirming is a hub call the backend cannot take yet; opening the issue is honest.
      onConfirm={openIssue}
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
      const copy = filter === 'all' ? EMPTY.all : EMPTY.filtered;
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
      <AppHeader
        title="واحة كُن"
        avatarUrl={avatarUrl}
        location={location}
        onOpenProfile={() => navigation.navigate('Profile')}
      />

      <FeedFilterTabs filter={filter} onChange={changeFilter} />

      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: screenPadding,
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
