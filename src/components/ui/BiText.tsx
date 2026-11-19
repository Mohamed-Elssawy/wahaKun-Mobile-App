import { useMemo } from 'react';

import { detectDirection, direction as uiDirection } from '@/i18n';
import type { Direction } from '@/i18n';

import { Text } from './Text';

import type { TextProps } from './Text';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';

// Explicit RLI/LRI + PDI isolates, not FSI, since direction is already resolved below; writingDirection is inert on Android.
const ISOLATE: Record<Direction, string> = { rtl: '⁧', ltr: '⁦' };
const POP_ISOLATE = '⁩';

// Paragraph direction is the only thing Android aligns by (measured in E9, RN 0.86); never a physical left/right, which swap under RTL and once put Arabic blocks on the left.
const PARAGRAPH: Record<Direction, TextStyle> = {
  rtl: { direction: 'rtl' },
  ltr: { direction: 'ltr' },
};

// L-CONTENT-ALIGN (E9 §2, §16.11): 'body' aligns to its own direction (transcripts, notes); 'title' keeps the layout's alignment instead.
export type BiTextRole = 'body' | 'title';

export type BiTextProps = TextProps & {
  /** Not `role`: Text already has one, and it is the accessibility role. */
  contentRole: BiTextRole;
  /** Set when a containing row already resolved and set its own Yoga direction; text then inherits it instead of resolving its own (RepairStepsList). */
  resolvedDirection?: Direction;
};

/** Null for anything that is not plain text, so elements fall back rather than being guessed at. */
function flattenText(node: ReactNode): string | null {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (!Array.isArray(node)) {
    return null;
  }

  let text = '';

  for (const child of node) {
    const part = flattenText(child);
    if (part === null) {
      return null;
    }
    text += part;
  }

  return text;
}

// L-AS-AUTHORED: content the app didn't write (Arabic in the English UI, or vice versa); every site must declare body or title, no default. A one-line title also sets its own direction, since Android's ellipsis otherwise clips its first letter (E9); an explicit align still wins (F-03a).
export function BiText({
  contentRole,
  resolvedDirection,
  numberOfLines,
  children,
  style,
  ...rest
}: BiTextProps) {
  const text = useMemo(() => flattenText(children), [children]);
  // Memoised because several of the adopted sites are list rows, where this runs per row.
  const detected = useMemo(
    () => resolvedDirection ?? (text ? detectDirection(text) : null),
    [resolvedDirection, text],
  );

  // Falls back to UI direction, never a guess - digits/punctuation-only content has no direction of its own.
  const resolved = detected ?? uiDirection();
  const ownsDirection =
    !resolvedDirection && (contentRole === 'body' || numberOfLines === 1);

  return (
    <Text
      {...rest}
      numberOfLines={numberOfLines}
      style={[ownsDirection ? PARAGRAPH[resolved] : null, style]}
    >
      {detected && text ? `${ISOLATE[detected]}${text}${POP_ISOLATE}` : children}
    </Text>
  );
}
