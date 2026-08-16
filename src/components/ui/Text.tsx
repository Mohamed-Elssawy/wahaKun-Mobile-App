import { Text as RNText } from 'react-native';

import { colors, maxFontScale, textStyles } from '@/theme';
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

/** The only way to render text here: family, size and line height travel together. */
// No weight prop, because Android ignores fontWeight when the family is explicit.
export function Text({
  variant = 'body14',
  color = 'textPrimary',
  align,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      // Capped in one place: unbounded OS scaling overflows every control with a height.
      maxFontSizeMultiplier={maxFontScale}
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
