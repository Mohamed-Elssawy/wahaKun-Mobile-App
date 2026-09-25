import { useNavigation } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { colors, screenPadding, spacing } from '@/theme';

/** Screens already navigate to these, so a placeholder beats "no screen named X". */
export function createPlaceholderScreen(title: string, note?: string) {
  const PlaceholderScreen = () => {
    const navigation = useNavigation();

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={hitSlop}>
              <ArrowRight size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.body}>
          <Text variant="h3" align="center">
            {title}
          </Text>
          <Text variant="body14" color="textSecondary" align="center">
            {note ?? 'هذه الشاشة قيد التطوير.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  };

  PlaceholderScreen.displayName = `Placeholder(${title})`;
  return PlaceholderScreen;
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: screenPadding,
    paddingTop: spacing[12],
    minHeight: spacing[40],
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
    paddingHorizontal: screenPadding,
  },
});
