import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

import { Text } from '@/components/ui';
import { colors, controlHeight, radii, shadows, spacing } from '@/theme';

import type { ReactNode } from 'react';

export type CollapsibleCardProps = {
  title: string;
  /** Open on first render. The explanation card starts open in the frame. */
  defaultOpen?: boolean;
  children: ReactNode;
};

const CHEVRON_SIZE = 24;

// Opt-in on Android, and guarded because a New Architecture build warns loudly.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** An AiDiagnosisCard whose body folds away. Used by "لماذا هذا التشخيص؟". */
// Not composed from it: this one owns a touchable header and a LayoutAnimation, so it only
// shares the chrome. Worth merging the moment a third card wants the same surface.
export function CollapsibleCard({
  title,
  defaultOpen = true,
  children,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Chevron = isOpen ? ChevronUp : ChevronDown;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(open => !open);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={title}
      >
        <Text variant="h4" align="right" style={styles.title}>
          {title}
        </Text>
        <Chevron size={CHEVRON_SIZE} color={colors.textStrong} />
      </TouchableOpacity>

      {isOpen ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[20],
    padding: spacing[24],
    gap: spacing[16],
    ...shadows.card,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    // The whole header is the target, so it has to clear 48dp on its own.
    minHeight: controlHeight,
  },
  // Takes the leftover width so the chevron stays pinned to the far edge.
  title: {
    flex: 1,
  },
});
