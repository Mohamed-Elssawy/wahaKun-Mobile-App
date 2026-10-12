import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type CaseResolutionSummaryCardProps = {
  title: string;
  photoUrl: string;
  notes: string;
};

const PHOTO_SIZE = 100;

/** §8.3's green-bordered `ملخص ما تم إرساله للمزارع` card, shared by E-05 and E-06. */
export function CaseResolutionSummaryCard({
  title,
  photoUrl,
  notes,
}: CaseResolutionSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text variant="h5" align="right" color="primaryPressed">
        {title}
      </Text>

      <View style={styles.row}>
        <Image source={{ uri: photoUrl }} style={styles.photo} />
        <Text variant="body16" color="primaryPressed" align="right" style={styles.notes}>
          {notes}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii[16],
    borderWidth: 1.5,
    borderColor: colors.primaryPressed,
    backgroundColor: colors.primaryTint,
    padding: spacing[16],
    gap: spacing[12],
  },
  row: {
    flexDirection: 'row-reverse',
    gap: spacing[12],
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radii[12],
    backgroundColor: colors.surfaceMuted,
  },
  notes: {
    flex: 1,
  },
});
