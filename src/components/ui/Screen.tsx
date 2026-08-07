import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing } from '@/theme';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: ReactNode;
  /** Pinned to the bottom, the layout every wizard step uses. */
  footer?: ReactNode;
  /** Apply the standard 24pt horizontal padding to children. */
  padded?: boolean;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
};

/** SafeAreaProvider is mounted once in app/App.tsx, so screens must not add their own. */
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
    paddingBottom: spacing[32],
    paddingTop: spacing[16],
    gap: spacing[16],
  },
});
