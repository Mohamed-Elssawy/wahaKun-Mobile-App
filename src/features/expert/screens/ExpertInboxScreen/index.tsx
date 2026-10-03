import { useNavigation } from '@react-navigation/native';
import { Inbox } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppHeader, EmptyState } from '@/components/ui';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { colors } from '@/theme';

const TITLE = 'الوارد';

/**
 * E-01, chrome only. The triage queue, its status tabs and its severity chips are a later
 * unit; this is the shell the §4.1 routing lands an approved expert in.
 */
export default function ExpertInboxScreen() {
  const navigation = useNavigation();
  const { avatarUrl, location } = useIdentity();

  return (
    <View style={styles.screen}>
      {/* Same header as the farmer shell, and the bell stays off until S-06 has a screen. */}
      <AppHeader
        title={TITLE}
        avatarUrl={avatarUrl}
        location={location}
        onOpenProfile={() => navigation.navigate('Profile')}
      />

      <View style={styles.body}>
        <EmptyState
          icon={Inbox}
          title="لا توجد حالات في الوارد"
          message="الحالات المسندة إليك ستظهر هنا."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
});
