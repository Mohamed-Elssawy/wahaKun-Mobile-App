import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing } from '@/theme';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: ReactNode;
  /**
   * Content and a bottom-pinned footer, the layout every wizard step uses
   * (`justifyContent: 'space-between'` on the root).
   */
  footer?: ReactNode;
  /** Apply the standard 24pt horizontal padding to children. */
  padded?: boolean;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Screen shell: safe-area handling plus the app background.
 *
 * Uses SafeAreaView only. SafeAreaProvider is mounted once in app/App.tsx —
 * screens must not mount their own.
 */
export function Screen({
  children,
  footer,
  padded = false,
  edges = ['top', 'bottom'],
  style,
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: screenPadding,
  },
  footer: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
});
