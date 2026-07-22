import { useNavigation } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing, textStyles } from '@/theme';

/**
 * Stand-in for routes that are designed in Figma but not built yet.
 *
 * Screens already navigate to these, so registering a themed placeholder keeps
 * the flow traversable instead of throwing "Do you have a screen named X?".
 */
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.note}>{note ?? 'هذه الشاشة قيد التطوير.'}</Text>
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
    paddingTop: spacing.md,
    minHeight: spacing.xxxl,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: screenPadding,
  },
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  note: {
    ...textStyles.body14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
