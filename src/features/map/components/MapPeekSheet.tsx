import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

import { MapPeekCard, PEEK_CARD_HEIGHT } from './MapPeekCard';

import type { MapIssue } from '../types';

export type MapPeekSheetProps = {
  /** Everything under the tapped pin, worst first. One issue draws F-05, several draw X-11. */
  issues: MapIssue[];
  onOpen: (issueId: string) => void;
  onDismiss: () => void;
};

const GRABBER_WIDTH = 45;
const GRABBER_HEIGHT = 4;

const VISIBLE_CARDS = 3;

/** A strip of the fourth card, since three full ones look the same as a stack of thirty. */
const OVERFLOW_PEEK = spacing[16];

// Three cards and the gaps around them, then enough of a fourth to show the list scrolls.
const LIST_MAX_HEIGHT = VISIBLE_CARDS * (PEEK_CARD_HEIGHT + spacing[16]) + OVERFLOW_PEEK;

/** F-05 and X-11: the sheet that rises over the tab bar when a pin is tapped. */
export function MapPeekSheet({ issues, onOpen, onDismiss }: MapPeekSheetProps) {
  const [first] = issues;

  return (
    <View style={styles.sheet}>
      <TouchableOpacity
        style={styles.grabberHit}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="إغلاق"
      >
        <View style={styles.grabber} />
      </TouchableOpacity>

      {issues.length === 1 ? (
        <>
          <MapPeekCard issue={first} />
          <Button label="تتبع البلاغ" onPress={() => onOpen(first.id)} showArrow />
        </>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {issues.map(issue => (
            <MapPeekCard key={issue.id} issue={issue} onPress={onOpen} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    // An expanded legend can leave the list less room than it asks for; shrinking beats clipping.
    flexShrink: 1,
    paddingTop: spacing[16],
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[16],
    gap: spacing[16],
    // Top corners only: the sheet sits on the tab bar, so its foot is never seen.
    borderTopLeftRadius: radii[20],
    borderTopRightRadius: radii[20],
    backgroundColor: colors.background,
    ...shadows.sheet,
  },
  grabberHit: {
    alignSelf: 'center',
    paddingVertical: spacing[4],
  },
  grabber: {
    width: GRABBER_WIDTH,
    height: GRABBER_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.textDisabled,
  },
  // Shrinks before the grabber and the padding do, so a squeezed sheet still reads as one.
  list: {
    flexShrink: 1,
    maxHeight: LIST_MAX_HEIGHT,
  },
  listContent: {
    gap: spacing[16],
  },
});
