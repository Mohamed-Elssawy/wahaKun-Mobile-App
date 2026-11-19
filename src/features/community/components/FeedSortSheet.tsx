import { Check } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, screenPadding, shadows, spacing } from '@/theme';

import { SORT_LABEL_KEYS } from './FeedChipRow';

import type { FeedSort } from '../types';

export type FeedSortSheetProps = {
  isVisible: boolean;
  sort: FeedSort;
  onSelect: (sort: FeedSort) => void;
  onDismiss: () => void;
};

const OPTIONS: readonly FeedSort[] = ['severity', 'newest', 'nearest'];

const CHECK_SIZE = 20;
const GRABBER_WIDTH = 45;
const GRABBER_HEIGHT = 4;

/** What the ترتيب chip opens. A plain Modal, matching MapPeekSheet rather than a sheet library. */
export function FeedSortSheet({
  isVisible,
  sort,
  onSelect,
  onDismiss,
}: FeedSortSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      // Android's back button has to close it, or the feed is unreachable behind it.
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={t('f05.close')}
      >
        {/* Swallows the press so tapping the sheet itself does not dismiss it. */}
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing[16] }]}
          onPress={() => {}}
        >
          <View style={styles.grabber} />

          <Text variant="h5" style={styles.title}>
            {t('f01.sortSheetTitle')}
          </Text>

          {OPTIONS.map(option => {
            const isActive = option === sort;

            return (
              <TouchableOpacity
                key={option}
                style={styles.option}
                onPress={() => onSelect(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  variant={isActive ? 'label16Bold' : 'label16'}
                  color={isActive ? 'primary' : 'textPrimary'}
                  style={styles.optionLabel}
                >
                  {t(SORT_LABEL_KEYS[option])}
                </Text>

                {isActive ? <Check size={CHECK_SIZE} color={colors.primary} /> : null}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii[20],
    borderTopRightRadius: radii[20],
    paddingHorizontal: screenPadding,
    paddingTop: spacing[12],
    gap: spacing[4],
    ...shadows.sheet,
  },
  grabber: {
    width: GRABBER_WIDTH,
    height: GRABBER_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
  },
  title: {
    paddingTop: spacing[12],
    paddingBottom: spacing[8],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    minHeight: 48,
  },
  optionLabel: {
    flex: 1,
  },
});
