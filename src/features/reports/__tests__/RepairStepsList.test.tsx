import { StyleSheet, Text as RNText, View } from 'react-native';
import { act, create } from 'react-test-renderer';

import { ARABIC_NAME, LATIN_NAME } from '@/__fixtures__/bidi';
import { androidEdge } from '@/components/ui/__tests__/androidTextEdge';
import type { Dir, Edge } from '@/components/ui/__tests__/androidTextEdge';
import { direction as uiDirection, setLocale } from '@/i18n';

import { RepairStepsList } from '../components/RepairStepsList';

import type { TextStyle, ViewStyle } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';

const START: Record<Dir, Edge> = { rtl: 'right', ltr: 'left' };

/** One row per step: its layout direction, text direction, and landing edge, via androidTextEdge.ts. */
function rowsOf(steps: string[]) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<RepairStepsList steps={steps} />);
  });

  const rows = tree.root
    .findAllByType(View)
    .filter(
      view =>
        (StyleSheet.flatten(view.props.style) as ViewStyle)?.flexDirection === 'row',
    );

  return rows.map(row => {
    const rowDirection = (StyleSheet.flatten(row.props.style) as ViewStyle)
      .direction as Dir;
    const texts = row.findAllByType(RNText);
    const step = texts[texts.length - 1] as ReactTestInstance;
    const stepStyle = StyleSheet.flatten(step.props.style) as TextStyle;

    return {
      rowDirection,
      textOwnsDirection: stepStyle.direction !== undefined,
      numberAt: START[rowDirection],
      textAt: androidEdge({
        layout: rowDirection,
        own: stepStyle.direction as Dir | undefined,
        align: stepStyle.textAlign as never,
        text: String(step.props.children),
      }),
    };
  });
}

afterEach(() => setLocale('ar'));

describe('RepairStepsList: the row follows the step, so the number travels with its text', () => {
  it.each([
    ['an Arabic step in the English UI', 'en', ARABIC_NAME, 'rtl'],
    ['a Latin step in the Arabic UI', 'ar', LATIN_NAME, 'ltr'],
    ['an Arabic step in the Arabic UI', 'ar', ARABIC_NAME, 'rtl'],
    ['a Latin step in the English UI', 'en', LATIN_NAME, 'ltr'],
  ] as const)('%s', (_, locale, step, expected) => {
    setLocale(locale);
    const [row] = rowsOf([step]);

    expect(row.rowDirection).toBe(expected);
    // One direction context: the text inherits the row's rather than resolving its own.
    expect(row.textOwnsDirection).toBe(false);
    // Body alignment, and on the same edge as the number.
    expect(row.textAt).toBe(START[expected]);
    expect(row.numberAt).toBe(row.textAt);
  });

  it('puts each row of a mixed list on its own edge', () => {
    setLocale('en');
    const rows = rowsOf([ARABIC_NAME, LATIN_NAME, ARABIC_NAME]);

    expect(rows.map(row => [row.numberAt, row.textAt])).toEqual([
      ['right', 'right'],
      ['left', 'left'],
      ['right', 'right'],
    ]);
  });

  it('falls back to the UI direction for a step with no letters', () => {
    setLocale('en');
    const [row] = rowsOf(['1, 2, 3']);

    expect(row.rowDirection).toBe(uiDirection());
  });
});
