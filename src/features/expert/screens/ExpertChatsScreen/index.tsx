import { useNavigation } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppHeader, EmptyState, ListSkeleton } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { t } from '@/i18n';
import { colors, screenPadding, spacing } from '@/theme';

import { ChatThreadRow } from '../../components/ChatThreadRow';
import { ExpertChatChipRow } from '../../components/ExpertChatChipRow';
import { useExpertChats } from '../../hooks/useExpertChats';

import type { ChatThread } from '../../types';

/** E-09. E-10 is a separate unit with no backend, so a row's tap is a no-op; the rest is real. */
export default function ExpertChatsScreen() {
  const navigation = useNavigation();
  const { avatarUrl } = useIdentity();
  const { threads, isEmpty, isLoading, error, filters, toggleFilter, refresh } =
    useExpertChats();

  // E-10 does not exist yet, so a thread has nowhere to open.
  const openThread = (_thread: ChatThread) => {};

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.list}>
          <ListSkeleton />
        </View>
      );
    }

    if (error) {
      return (
        <ReportErrorView
          error={error}
          unknownTitle={t('e09.loadErrorTitle')}
          onRetry={refresh}
        />
      );
    }

    if (isEmpty) {
      return (
        <EmptyState
          icon={MessageCircle}
          title={t('e09.emptyTitle')}
          message={t('e09.emptyBody')}
        />
      );
    }

    return (
      <FlatList
        data={threads}
        keyExtractor={thread => thread.id}
        renderItem={({ item }) => <ChatThreadRow thread={item} onPress={openThread} />}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title={t('tabs.chats')}
        avatarUrl={avatarUrl}
        onOpenProfile={() => navigation.navigate('Profile')}
        onOpenNotifications={() => navigation.navigate('Notifications')}
      />

      <ExpertChatChipRow filters={filters} onToggleFilter={toggleFilter} />

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
  },
});
