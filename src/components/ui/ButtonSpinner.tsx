import { ActivityIndicator } from 'react-native';

import { colors } from '@/theme';
import type { ColorToken } from '@/theme';

export type ButtonSpinnerProps = {
  /** Match whatever the label would have been, or the spinner vanishes on a pale fill. */
  color?: ColorToken;
  size?: 'small' | 'large';
};

/** SYSTEM-SPEC §5.3's inline button spinner. Button swaps it in for its own label. */
export function ButtonSpinner({
  color = 'textInverse',
  size = 'small',
}: ButtonSpinnerProps) {
  return <ActivityIndicator color={colors[color]} size={size} />;
}
