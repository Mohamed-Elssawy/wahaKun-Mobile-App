import { useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { BackArrow } from '@/i18n/icons';
import { colors, screenPadding, spacing } from '@/theme';

// Screens already navigate to these, so a placeholder beats "no screen named X"; takes a key, not a string, so the lookup defers to render instead of resolving before the locale does.
export function createPlaceholderScreen(
  titleKey: TranslationKey,
  noteKey?: TranslationKey,
) {
  const PlaceholderScreen = () => {
    const navigation = useNavigation();

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={hitSlop}>
              <BackArrow size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.body}>
          <Text variant="h3" align="center">
            {t(titleKey)}
          </Text>
          <Text variant="body14" color="textSecondary" align="center">
            {t(noteKey ?? 'dev.placeholder')}
          </Text>
        </View>
      </SafeAreaView>
    );
  };

  PlaceholderScreen.displayName = `Placeholder(${titleKey})`;
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
    justifyContent: 'flex-start',
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
