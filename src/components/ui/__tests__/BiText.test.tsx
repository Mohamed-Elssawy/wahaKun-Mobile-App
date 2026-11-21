import { Text as RNText, StyleSheet, View } from 'react-native';
import { act, create } from 'react-test-renderer';

import { ARABIC_WITH_LATIN_PRODUCT, MIXED_IN_ONE_STRING } from '@/__fixtures__/bidi';
import { direction as uiDirection, setLocale } from '@/i18n';

import { BiText } from '../BiText';
import { androidEdge, MEASURED } from './androidTextEdge';

import type { BiTextProps } from '../BiText';
import type { Dir, Edge } from './androidTextEdge';
import type { TextStyle } from 'react-native';

const RLI = '⁧';
const LRI = '⁦';
const PDI = '⁩';

const ARABIC = ARABIC_WITH_LATIN_PRODUCT;
const ENGLISH = 'The crack runs along the joint';

// Hoisted so the assertion is about precedence, not about an inline style the linter warns on.
const CALLER_STYLE = { textAlign: 'center' } as const;

function render(props: BiTextProps) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<BiText {...props} />);
  });

  const text = tree.root.findByType(RNText);

  return {
    style: StyleSheet.flatten(text.props.style) as TextStyle,
    children: text.props.children as unknown,
  };
}

// Where the block lands on an Android device (via the model the first describe validates), not just what textAlign the style object claims.
function edgeOf(props: BiTextProps): Edge {
  const { style, children } = render(props);

  return androidEdge({
    layout: uiDirection(),
    own:
      style.direction === 'rtl' || style.direction === 'ltr'
        ? style.direction
        : undefined,
    align: style.textAlign as never,
    text: typeof children === 'string' ? children : '',
  });
}

const START: Record<Dir, Edge> = { rtl: 'right', ltr: 'left' };

afterEach(() => setLocale('ar'));

// Load-bearing: the model must reproduce what the device measured, including the three cells where the old BiText was wrong, before any test below may rest on it.
describe('the Android edge model, against the 12 cells E9 measured on the device', () => {
  it.each(MEASURED.map(entry => [entry.cell, entry]))('%s', (_, entry) => {
    expect(androidEdge(entry.line)).toBe(entry.edge);
  });
});

describe('BiText contentRole="body": a block lands on its content\'s edge in both locales', () => {
  it.each([
    ['Arabic in the Arabic UI', 'ar', ARABIC, 'right'],
    ['Arabic in the English UI', 'en', ARABIC, 'right'],
    ['English in the Arabic UI', 'ar', ENGLISH, 'left'],
    ['English in the English UI', 'en', ENGLISH, 'left'],
  ] as const)('%s', (_, locale, content, edge) => {
    setLocale(locale);

    expect(edgeOf({ contentRole: 'body', children: content })).toBe(edge);
  });
});

describe('BiText contentRole="title": a title takes the layout\'s edge and keeps its writing direction', () => {
  it.each([
    ['Arabic in the Arabic UI', 'ar', ARABIC],
    ['Arabic in the English UI', 'en', ARABIC],
    ['English in the Arabic UI', 'ar', ENGLISH],
    ['English in the English UI', 'en', ENGLISH],
  ] as const)('%s', (_, locale, content) => {
    setLocale(locale);
    const { children } = render({ contentRole: 'title', children: content });

    expect(edgeOf({ contentRole: 'title', children: content })).toBe(
      START[uiDirection()],
    );
    // The writing direction is the content's, whatever the alignment.
    expect(children).toBe(`${content === ARABIC ? RLI : LRI}${content}${PDI}`);
  });

  // A one-line title's ellipsis clips its first letter unless it lays out in its own direction (E9, 7px).
  it('gives a single-line title its content direction, so a truncated one cannot clip', () => {
    setLocale('en');

    expect(
      render({ contentRole: 'title', numberOfLines: 1, children: ARABIC }).style
        .direction,
    ).toBe('rtl');
    expect(
      render({ contentRole: 'title', numberOfLines: 2, children: ARABIC }).style
        .direction,
    ).toBeUndefined();
  });
});

describe('BiText inside a row that already resolved the direction', () => {
  // RepairStepsList: the row carries the step's direction, so the text must inherit it rather than resolve its own.
  it('sets no direction of its own and isolates in the direction it was handed', () => {
    setLocale('en');
    const { style, children } = render({
      contentRole: 'body',
      resolvedDirection: 'rtl',
      children: ARABIC,
    });

    expect(style.direction).toBeUndefined();
    expect(children).toBe(`${RLI}${ARABIC}${PDI}`);
  });
});

describe('BiText direction resolution', () => {
  it('reads mixed content by its first strong character', () => {
    setLocale('en');

    expect(edgeOf({ contentRole: 'body', children: MIXED_IN_ONE_STRING })).toBe('right');
  });

  // The isolate carries writing direction on Android, so "no direction" has to mean no isolate.
  it('falls back to the UI direction for digits-only content, and does not isolate it', () => {
    const { children } = render({ contentRole: 'body', children: '#1043' });

    expect(children).toBe('#1043');
    expect(edgeOf({ contentRole: 'body', children: '#1043' })).toBe('right');
  });

  it('falls back to the UI direction for empty content', () => {
    setLocale('en');
    const { children } = render({ contentRole: 'body', children: '' });

    expect(children).toBe('');
  });

  it('joins array children before deciding, rather than reading only the first', () => {
    setLocale('en');
    const { style, children } = render({
      contentRole: 'body',
      children: ['”', ARABIC, '“'],
    });

    expect(style.direction).toBe('rtl');
    expect(children).toBe(`${RLI}”${ARABIC}“${PDI}`);
  });

  it('passes children through untouched when they are not plain text', () => {
    const element = <View />;
    const { children } = render({ contentRole: 'body', children: element });

    expect(children).toBe(element);
  });

  // writingDirection is inert on Android, so setting it only made the style object look right; E9 retired it.
  it('never sets writingDirection or a physical textAlign', () => {
    for (const contentRole of ['body', 'title'] as const) {
      const { style } = render({ contentRole, children: ARABIC });

      expect(style.writingDirection).toBeUndefined();
      expect(style.textAlign).toBeUndefined();
    }
  });
});

describe('BiText as a drop-in for Text', () => {
  // F-03a centres its diagnosis title because the frame does; content direction doesn't overrule it.
  it('lets an explicit align win', () => {
    setLocale('en');

    expect(edgeOf({ contentRole: 'title', align: 'center', children: ARABIC })).toBe(
      'center',
    );
  });

  it('keeps the caller style last, so it can still override', () => {
    const { style } = render({
      contentRole: 'body',
      style: CALLER_STYLE,
      children: ENGLISH,
    });

    expect(style.textAlign).toBe('center');
  });
});
