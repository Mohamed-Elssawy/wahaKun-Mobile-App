import { useNavigation } from '@react-navigation/native';
import { Map } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppHeader, EmptyState } from '@/components/ui';
import { useIdentity } from '@/features/user/hooks/useIdentity';
import { colors } from '@/theme';

const TITLE = 'خريطة الواحة';

/**
 * E-08, chrome only. The expert's map differs from the farmer's in what a pin opens, so it is
 * its own screen rather than a flag on F-05; the pins and the peek sheet are a later unit.
 */
export default function ExpertMapScreen() {
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
          icon={Map}
          title="لا توجد حالات على الخريطة"
          message="الحالات المسندة إليك ستظهر على الخريطة."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
});
