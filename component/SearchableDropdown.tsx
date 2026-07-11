import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';

import { Search } from 'lucide-react-native';

import styles from './SearchableDropdownStyle';
import { LocationItem } from '../types/Location';

type Props = {
  label: string;
  placeholder: string;
  data: LocationItem[];
  onSelect: (item: LocationItem) => void;

  /**
   * Whether THIS field's list is currently open. Lifted up to the parent
   * (instead of kept as local state) so the parent can guarantee only one
   * field is open at a time — opening one field simply means the parent
   * stops saying the other one is open, no timing tricks needed.
   */
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  /** Blocks opening/typing while true (e.g. before the governorate is chosen). */
  disabled?: boolean;
  /** Placeholder shown instead of `placeholder` while `disabled` is true. */
  disabledPlaceholder?: string;
};

const SearchableDropdown = ({
  label,
  placeholder,
  data,
  onSelect,
  isOpen,
  onOpenChange,
  disabled = false,
  disabledPlaceholder,
}: Props) => {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<LocationItem | null>(null);

  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, data]);

  const openDropdown = () => {
    if (disabled) return;
    onOpenChange(true);
  };

  const handleSelect = (item: LocationItem) => {
    setSelectedItem(item);
    setSearch(item.name);
    onOpenChange(false);
    onSelect(item);
  };

  const handleBlur = () => {
    // Safety net for cases with no explicit select or explicit open of the
    // other field — e.g. dismissing the keyboard or tapping the "التالي"
    // button. Slight delay so a tap on a list item registers as a select first.
    setTimeout(() => onOpenChange(false), 150);
  };

  const isListVisible = isOpen && !disabled;
  const displayPlaceholder = disabled
    ? disabledPlaceholder ?? placeholder
    : placeholder;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* One single bordered box: search row on top, list (when open) right
          under it, separated by a single divider line — no gap, no double
          border, so it reads as one control instead of two. Everything stays
          in normal layout flow (no absolute positioning), so whatever sits
          below this field on the screen gets pushed down automatically when
          the list opens, instead of the list floating on top of it. */}
      <View
        style={[
          styles.box,
          isListVisible && filteredData.length > 0 && styles.boxOpen,
          disabled && styles.boxDisabled,
        ]}
      >
        <TouchableOpacity
          activeOpacity={disabled ? 1 : 0.8}
          onPress={openDropdown}
        >
          <View style={styles.inputRow}>
            <TextInput
              value={search}
              onChangeText={text => {
                setSearch(text);
                openDropdown();
              }}
              onFocus={openDropdown}
              onBlur={handleBlur}
              editable={!disabled}
              placeholder={displayPlaceholder}
              placeholderTextColor="#9A9A9A"
              style={styles.input}
              textAlign="right"
            />

            <Search size={22} color={disabled ? '#C4C4C4' : '#777777'} />
          </View>
        </TouchableOpacity>

        {isListVisible && (
          <>
            {/* the divider line between the search row and the list */}
            <View style={styles.divider} />

            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filteredData}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              style={styles.list}
              ItemSeparatorComponent={() => (
                <View style={styles.itemSeparator} />
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.itemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>لا توجد نتائج</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
    </View>
  );
};

export default SearchableDropdown;
