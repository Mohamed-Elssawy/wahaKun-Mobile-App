import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';
import type { LocationItem } from '@/types/location';

import { Text } from './Text';

export type SearchableDropdownProps = {
  label: string;
  placeholder: string;
  data: LocationItem[];
  onSelect: (item: LocationItem) => void;

  /**
   * Whether this field's list is open. Lifted to the parent so only one field
   * can be open at a time: opening one means the parent stops saying the other
   * is open, with no timing tricks.
   */
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  /** Blocks opening/typing, e.g. area before a governorate is chosen. */
  disabled?: boolean;
  disabledPlaceholder?: string;
};

/** Delay before a blur closes the list, so a tap on a row registers first. */
const BLUR_CLOSE_DELAY_MS = 150;

export function SearchableDropdown({
  label,
  placeholder,
  data,
  onSelect,
  isOpen,
  onOpenChange,
  disabled = false,
  disabledPlaceholder,
}: SearchableDropdownProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => data.filter(item => item.name.toLowerCase().includes(search.toLowerCase())),
    [search, data],
  );

  const open = () => {
    if (!disabled) {
      onOpenChange(true);
    }
  };

  const handleSelect = (item: LocationItem) => {
    setSearch(item.name);
    onOpenChange(false);
    onSelect(item);
  };

  const handleBlur = () => {
    // Safety net for dismissing the keyboard or tapping the next button
    // without an explicit select.
    setTimeout(() => onOpenChange(false), BLUR_CLOSE_DELAY_MS);
  };

  const isListVisible = isOpen && !disabled;

  return (
    <View style={styles.container}>
      <Text variant="label14" color="textMuted" align="right">
        {label}
      </Text>

      {/* One bordered box wrapping the search row and the list, separated by a
          single divider — so it reads as one control rather than two. Nothing
          is absolutely positioned, so content below is pushed down when the
          list opens instead of being covered by it. */}
      <View style={[styles.box, disabled && styles.boxDisabled]}>
        <TouchableOpacity activeOpacity={disabled ? 1 : 0.8} onPress={open}>
          <View style={styles.inputRow}>
            <TextInput
              value={search}
              onChangeText={text => {
                setSearch(text);
                open();
              }}
              onFocus={open}
              onBlur={handleBlur}
              editable={!disabled}
              placeholder={disabled ? (disabledPlaceholder ?? placeholder) : placeholder}
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              textAlign="right"
            />
            <Search size={22} color={disabled ? colors.borderStrong : colors.textMuted} />
          </View>
        </TouchableOpacity>

        {isListVisible && (
          <>
            <View style={styles.divider} />
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filtered}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              style={styles.list}
              ItemSeparatorComponent={ItemSeparator}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                  <Text variant="label16" align="right">
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={ListEmpty}
            />
          </>
        )}
      </View>
    </View>
  );
}

// Defined outside the component so React does not see a new component type on
// every render and tear down the subtree.
const ItemSeparator = () => <View style={styles.itemSeparator} />;

const ListEmpty = () => (
  <View style={styles.empty}>
    <Text variant="label14" color="textSubtle">
      لا توجد نتائج
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.xxs,
  },
  box: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  boxDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  inputRow: {
    width: '100%',
    height: 44,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    ...textStyles.label16,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
  },
  list: {
    maxHeight: 260,
  },
  item: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  empty: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
