import { useNavigation } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppHeader, EmptyState, ProgressRing } from '@/components/ui';
import { ReportErrorView } from '@/features/reports/components/ReportErrorView';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { colors } from '@/theme';

import { ExpertChatChipRow } from '../../components/ExpertChatChipRow';
import { useExpertChats } from '../../hooks/useExpertChats';

const TITLE = 'المحادثات';
const EMPTY_TITLE = 'لا توجد محادثات';
const EMPTY_MESSAGE = 'ستظهر هنا المحادثات فور بدئها.';
const LOAD_ERROR_TITLE = 'تعذر تحميل المحادثات';

/**
 * §8.3's E-09. The thread row, the message-preview rendering and E-10 itself are a separate
 * unit - this is the designed empty state over a real (if currently always-empty) service
 * interface, so a real implementation can drop in later without touching this screen.
 */
export default function ExpertChatsScreen() {
  const navigation = useNavigation();
  const { avatarUrl } = useIdentity();
  const { isEmpty, isLoading, error, filters, toggleFilter, refresh } = useExpertChats();

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
          unknownTitle={LOAD_ERROR_TITLE}
          onRetry={refresh}
        />
      );
    }

    if (isEmpty) {
      return (
        <EmptyState icon={MessageCircle} title={EMPTY_TITLE} message={EMPTY_MESSAGE} />
      );
    }

    // Threads will render as rows once E-10 exists to open; nothing reaches this branch today.
    return null;
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title={TITLE}
        avatarUrl={avatarUrl}
        onOpenProfile={() => navigation.navigate('Profile')}
      />

      <ExpertChatChipRow filters={filters} onToggleFilter={toggleFilter} />

      <View style={styles.body}>{renderBody()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
