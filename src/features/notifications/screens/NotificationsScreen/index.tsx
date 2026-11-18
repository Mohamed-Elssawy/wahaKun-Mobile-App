import { Bell } from 'lucide-react-native';
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';

import { BackHeader, EmptyState } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { t } from '@/i18n';
import type { ScreenProps } from '@/navigation/types';
import { colors, screenPadding, spacing } from '@/theme';

import { NotificationGroupHeader } from '../../components/NotificationGroupHeader';
import { NotificationRow } from '../../components/NotificationRow';
import { useNotifications } from '../../hooks/useNotifications';
import { groupNotifications } from '../../time';

import type { NotificationDestination, NotificationItem } from '../../types';

/** S-06. A plain root-stack push, which shows no tab bar and so satisfies §4.3 already. */
export default function NotificationsScreen({
  navigation,
}: ScreenProps<'Notifications'>) {
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    retry,
    loadMore,
    markRead,
    markAllRead,
    isEmpty,
  } = useNotifications();

  // Tab destinations go back to the shell already under this screen; navigate would push a second copy.
  const goTo = (destination: NotificationDestination) => {
    switch (destination.screen) {
      case 'OasisMap':
        navigation.popTo('Home', { screen: 'OasisMap' });
        return;
      case 'ExpertInbox':
        navigation.popTo('ExpertHome', { screen: 'ExpertInbox' });
        return;
      case 'ReportTracker':
        navigation.navigate('ReportTracker', { reportId: destination.reportId });
        return;
      case 'IssueDetails':
        navigation.navigate('IssueDetails', { reportId: destination.reportId });
        return;
      case 'ExpertCaseReview':
        navigation.navigate('ExpertCaseReview', {
          reportId: destination.reportId,
          state: destination.state,
        });
        return;
      case 'ExpertCaseClosed':
        navigation.navigate('ExpertCaseClosed', { reportId: destination.reportId });
    }
  };

  const openNotification = (notification: NotificationItem) => {
    markRead(notification.id);
    goTo(notification.destination);
  };

  const renderBody = () => {
    if (error) {
      return (
        <View style={styles.fallback}>
          <ReportErrorView
            error={error}
            unknownTitle={t('s06.loadErrorTitle')}
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
      return (
        <View style={styles.fallback}>
          <EmptyState
            icon={Bell}
            title={t('s06.emptyTitle')}
            message={t('s06.emptyBody')}
          />
        </View>
      );
    }

    return (
      <SectionList
        sections={groupNotifications(items)}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationRow notification={item} onPress={openNotification} />
        )}
        renderSectionHeader={({ section }) => (
          <NotificationGroupHeader
            group={section.group}
            title={section.title}
            onMarkAllRead={markAllRead}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        // Loads past الأسبوع الماضي with no hard cutoff, and no RefreshControl: G-NO-PTR.
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
      <BackHeader title={t('common.notifications')} onBack={() => navigation.goBack()} />
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
    paddingHorizontal: screenPadding,
    paddingTop: spacing[12],
    paddingBottom: spacing[24],
    gap: spacing[12],
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: spacing[16],
  },
});
