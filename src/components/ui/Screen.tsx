import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing } from '@/theme';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: ReactNode;
  /** Pinned to the bottom, the layout every wizard step uses. Stays above the keyboard. */
  footer?: ReactNode;
  /** Apply the standard 24pt horizontal padding to children. */
  padded?: boolean;
  /**
   * Put the content in a ScrollView. Use it on any screen with text inputs: when the keyboard
   * shrinks the window, the fields scroll instead of sliding under the pinned footer.
   */
  scrollable?: boolean;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
};

/** SafeAreaProvider is mounted once in app/App.tsx, so screens must not add their own. */
export function Screen({
  children,
  footer,
  padded = false,
  scrollable = false,
  edges = ['top', 'bottom'],
  style,
}: ScreenProps) {
  const content = scrollable ? (
    <ScrollView
      style={styles.content}
      contentContainerStyle={[styles.scrollContent, padded && styles.padded]}
      // First tap on a button works while the keyboard is open, instead of only dismissing it.
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, padded && styles.padded]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {/* Without this, edge-to-edge keeps Android from resizing the window and the pinned footer sits behind the keyboard. */}
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing[24],
  },
  padded: {
    paddingHorizontal: screenPadding,
  },
  footer: {
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[32],
    paddingTop: spacing[16],
    gap: spacing[12],
    // Opaque, so a scrolled field never shows through behind the button.
    backgroundColor: colors.background,
  },
});
