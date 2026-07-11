import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: 342,
    alignSelf: 'center',
  },

  label: {
    fontSize: 14,
    color: '#6D6E71',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    textAlign: 'right',
    lineHeight: 21,
    marginBottom: 2,
  },

  // The single box that wraps BOTH the search row and the list. One border +
  // radius around the whole thing, so the list sits flush under the search
  // row with nothing in between but the divider line.
  box: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD2E0',
    borderRadius: 6,
    overflow: 'hidden',
  },

  boxOpen: {
    borderColor: '#CBD2E0',
  },

  // Muted look while the field is locked (e.g. the "المنطقة" field before a
  // governorate has been picked).
  boxDisabled: {
    backgroundColor: '#F2F3F5',
    borderColor: '#E1E4EA',
  },

  inputRow: {
    width: '100%',
    height: 44,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#2F2F2F',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
    textAlign: 'right',
    paddingVertical: 0,
  },

  // hairline separating the search row from the list beneath it.
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#E4E4E4',
  },

  list: {
    maxHeight: 260,
  },

  item: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  // separator BETWEEN items only (FlatList's ItemSeparatorComponent never
  // renders after the last row), so there's no stray line under the last
  // option and no double line with the divider above.
  itemSeparator: {
    height: 0.5,
    backgroundColor: '#EEEEEE',
  },

  itemText: {
    fontSize: 16,
    color: '#2F2F2F',
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
  },

  emptyContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 15,
    color: '#9A9A9A',
    fontFamily: 'NotoSansArabic_Condensed-Regular',
  },
});

export default styles;
