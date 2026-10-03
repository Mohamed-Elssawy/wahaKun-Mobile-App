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

import { AppHeader, Text } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { ReportsEmptyState } from '@/features/reports/components/ReportsEmptyState';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { colors, radii, screenPadding, shadows, spacing } from '@/theme';

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
    toggleConfirmation,
  } = useCommunityFeed();
  const [actionError, setActionError] = useState('');

  const confirm = async (issueId: string) => {
    setActionError('');
    const message = await toggleConfirmation(issueId);
    if (message) {
      setActionError(message);
    }
  };

  const openIssue = (issueId: string) =>
    navigation.navigate('IssueDetails', { reportId: issueId });

  const renderItem = ({ item }: { item: FeedPost }) => (
    <FeedPostCard post={item} origin={origin} onPress={openIssue} onConfirm={confirm} />
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
      {/* Green bar, then the sand band holding location + categories, lifted above the list. */}
      <View style={styles.header}>
        <AppHeader
          title="واحة كُن"
          avatarUrl={avatarUrl}
          location={location}
          onOpenProfile={() => navigation.navigate('Profile')}
        />
        <FeedFilterTabs filter={filter} onChange={changeFilter} />
      </View>

      {actionError ? (
        <View style={styles.banner} accessibilityLiveRegion="polite">
          <Text variant="label12" color="errorText" align="right">
            {actionError}
          </Text>
        </View>
      ) : null}

      {renderBody()}
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
    padding: screenPadding,
    paddingTop: spacing[24],
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
