import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme';

const CIRCLE_SIZE = 120;
const ICON_SIZE = 56;

/** S-05.6 and S-05.6b's empty-band mark, same green-tinted-circle shape every other terminal screen uses. */
export function SuccessIllustration() {
  return (
    <View style={styles.circle}>
      <CheckCircle2 size={ICON_SIZE} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
