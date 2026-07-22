import { Text as RNText } from 'react-native';

import { colors, textStyles } from '@/theme';
import type { ColorToken, TextVariant } from '@/theme';

import type { StyleProp, TextProps as RNTextProps, TextStyle } from 'react-native';

export type TextProps = Omit<RNTextProps, 'style'> & {
  /** Figma text style. Defaults to body14. */
  variant?: TextVariant;
  /** Semantic colour token. Defaults to textPrimary. */
  color?: ColorToken;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
};

/**
 * The only way text should be rendered in this app. Family, size and line
 * height travel together as one Figma text style rather than being set
 * independently.
 *
 * There is deliberately no `weight` prop: weight is part of the family name
 * (Cairo-SemiBold, NotoSansArabic-Medium), because Android ignores fontWeight
 * when an explicit PostScript family is set.
 */
export function Text({
  variant = 'body14',
  color = 'textPrimary',
  align,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        textStyles[variant],
        { color: colors[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
