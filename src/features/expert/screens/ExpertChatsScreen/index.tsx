import { useNavigation } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppHeader, EmptyState } from '@/components/ui';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { colors } from '@/theme';

const TITLE = 'المحادثات';

/**
 * E-09, chrome only. The thread list and its green unread dots are a later unit; the dot on
 * the tab itself is already wired, through useUnreadChats.
 */
export default function ExpertChatsScreen() {
  const navigation = useNavigation();
  const { avatarUrl, location } = useIdentity();

  return (
    <View style={styles.screen}>
      <AppHeader
        title={TITLE}
        avatarUrl={avatarUrl}
        location={location}
        onOpenProfile={() => navigation.navigate('Profile')}
      />

      <View style={styles.body}>
        <EmptyState
          icon={MessageCircle}
          title="لا توجد محادثات"
          message="محادثاتك مع المزارعين ستظهر هنا."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
});
