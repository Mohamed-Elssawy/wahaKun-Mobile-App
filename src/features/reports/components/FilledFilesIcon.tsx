import { Files } from 'lucide-react-native';
import { forwardRef } from 'react';

import { colors } from '@/theme';

import type { LucideProps } from 'lucide-react-native';
import type { Svg } from 'react-native-svg';

/** C65's filled document-stack glyph: Lucide's outline-only `Files` with the fill turned on. */
export const FilledFilesIcon = forwardRef<Svg, LucideProps>(({ color, ...rest }, ref) => (
  <Files ref={ref} {...rest} fill={color} color={colors.primaryTint} />
));

FilledFilesIcon.displayName = 'FilledFilesIcon';
