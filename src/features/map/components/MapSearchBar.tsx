import { Search, X } from 'lucide-react-native';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, maxFontScale, radii, shadows, spacing, textStyles } from '@/theme';

import { MAP_CONTROL_ICON, MapControlButton } from './MapControlButton';

export type MapSearchBarProps = {
  /** Collapsed to its button when the map is zoomed in, which is what F-05 draws. */
  isExpanded: boolean;
  value: string;
  onChange: (value: string) => void;
  onToggle: () => void;
};

const FIELD_ICON = 18;
const PLACEHOLDER = 'ابحث عن منطقة أو بلاغ...';

/** The glyph is 18, and it is the only way out of a search, so the target is widened to 50. */
const CLEAR_HIT_SLOP = {
  top: spacing[16],
  right: spacing[16],
  bottom: spacing[16],
  left: spacing[16],
};

/** F-05's search. Filters loaded pins: SearchForIssueByTitleInMap 500s on no match and folds no spelling. */
export function MapSearchBar({
  isExpanded,
  value,
  onChange,
  onToggle,
}: MapSearchBarProps) {
  const button = (
    <MapControlButton
      icon={<Search size={MAP_CONTROL_ICON} color={colors.primary} />}
      onPress={onToggle}
      accessibilityLabel="بحث"
    />
  );

  if (!isExpanded) {
    // Right-aligned, where the frame puts the collapsed button.
    return <View style={styles.collapsed}>{button}</View>;
  }

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Search size={FIELD_ICON} color={colors.textSecondary} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={PLACEHOLDER}
          placeholderTextColor={colors.textPlaceholder}
          maxFontSizeMultiplier={maxFontScale}
          returnKeyType="search"
          accessibilityLabel={PLACEHOLDER}
        />
        {value.length > 0 ? (
          <TouchableOpacity
            onPress={() => onChange('')}
            hitSlop={CLEAR_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="مسح البحث"
          >
            <X size={FIELD_ICON} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {button}
    </View>
  );
}

const styles = StyleSheet.create({
  // Plain row, not row-reverse: the frame puts the field left and the button right.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  collapsed: {
    alignItems: 'flex-end',
  },
  field: {
    flex: 1,
    // The magnifier sits at the trailing edge of an Arabic line, so the row reverses.
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    height: 45,
    paddingHorizontal: spacing[24],
    borderRadius: radii[12],
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  input: {
    flex: 1,
    ...textStyles.label14,
    color: colors.textPrimary,
    textAlign: 'right',
    // Android gives TextInput its own vertical padding, which breaks the 45 height.
    paddingVertical: 0,
    // Android also aligns to the top of what is left, so both props are needed to centre it.
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
