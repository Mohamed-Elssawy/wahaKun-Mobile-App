import type { ReactElement } from 'react';
import type { ReactTestRendererJSON } from 'react-test-renderer';

/** Renders one subject in both locales, each in a fresh module registry, since typography freezes its fonts at module init. */

export type Locale = 'ar' | 'en';

type Build = () => ReactElement;

/** Module path -> mock factory, applied to ONE registry and undone after it like the env mock. */
export type Mocks = Record<string, () => unknown>;

/** Babel rewrites `@/` only in a literal path, so a path arriving here in a variable needs manual resolution. */
// Jest runs this under Node, which defines it; the app's tsconfig carries no Node types.
declare const __dirname: string;

function resolveMockPath(modulePath: string): string {
  const path = require('path');

  return modulePath.startsWith('@/')
    ? path.join(__dirname, '..', '..', modulePath.slice(2))
    : modulePath;
}

/** `build` must `require` its subject inside the isolated registry, not import it at the file's top, or styles freeze wrong. */
export function renderIn(
  locale: Locale,
  build: Build,
  mocks: Mocks = {},
): ReactTestRendererJSON {
  let json: ReactTestRendererJSON | ReactTestRendererJSON[] | null = null;

  jest.isolateModules(() => {
    jest.doMock('@/config/env', () => ({
      ...jest.requireActual('@/config/env'),
      FORCE_LOCALE: locale === 'en' ? 'en' : null,
    }));
    for (const [modulePath, factory] of Object.entries(mocks)) {
      jest.doMock(resolveMockPath(modulePath), factory);
    }

    const React = require('react');
    const renderer = require('react-test-renderer');
    const { SafeAreaProvider } = require('react-native-safe-area-context');
    const metrics = {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    };
    let tree: { toJSON: () => typeof json } | undefined;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(SafeAreaProvider, { initialMetrics: metrics }, build()),
      );
    });

    json = tree!.toJSON();
    renderer.act(() => {
      (tree as unknown as { unmount: () => void }).unmount();
    });
  });

  // doMock persists past isolateModules, so the next test's require would boot in this locale.
  jest.dontMock('@/config/env');
  for (const modulePath of Object.keys(mocks)) jest.dontMock(resolveMockPath(modulePath));

  if (!json || Array.isArray(json)) {
    throw new Error('renderIn: the subject rendered nothing, or more than one root');
  }

  return json;
}

export function renderBilingual(
  build: Build,
  mocks: Mocks = {},
): Record<Locale, ReactTestRendererJSON> {
  return { ar: renderIn('ar', build, mocks), en: renderIn('en', build, mocks) };
}

type Style = Record<string, unknown>;

function flatten(style: unknown): Style {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));

  return typeof style === 'object' ? (style as Style) : {};
}

/** The style keys a direction or font regression shows up in. Everything else is noise here. */
const KEPT = [
  'flexDirection',
  'direction',
  'writingDirection',
  'textAlign',
  'alignItems',
  'alignSelf',
  'justifyContent',
  'start',
  'end',
  'left',
  'right',
  'transform',
];

function describeText(style: Style): string {
  const font = style.fontFamily ? String(style.fontFamily) : '?';
  const size = style.fontSize !== undefined ? String(style.fontSize) : '?';
  const leading = style.lineHeight !== undefined ? '/' + String(style.lineHeight) : '';

  return font + ' ' + size + leading;
}

function layoutOf(style: Style): string {
  return KEPT.filter(key => style[key] !== undefined)
    .map(key => key + ':' + JSON.stringify(style[key]))
    .join(' ');
}

/** A pruned tree as text: every Text's face/size/string and every View's direction-bearing style, nothing else pinned. */
export function prune(
  node: ReactTestRendererJSON | string,
  depth = 0,
  out: string[] = [],
): string[] {
  const pad = '  '.repeat(depth);

  if (typeof node === 'string') {
    out.push(pad + JSON.stringify(node));
    return out;
  }

  const style = flatten(node.props.style);

  if (node.type === 'Text') {
    const text = (node.children ?? [])
      .map(child => (typeof child === 'string' ? child : ''))
      .join('');
    const layout = layoutOf(style);

    out.push(
      pad +
        'Text ' +
        describeText(style) +
        (layout ? ' ' + layout : '') +
        ' ' +
        JSON.stringify(text),
    );
    for (const child of node.children ?? []) {
      if (typeof child !== 'string') prune(child, depth + 1, out);
    }
    return out;
  }

  const layout = layoutOf(style);
  const label = node.props.accessibilityLabel
    ? ' a11y=' + JSON.stringify(node.props.accessibilityLabel)
    : '';
  const shown = Boolean(layout || label);

  if (shown) out.push(pad + node.type + (layout ? ' ' + layout : '') + label);
  for (const child of node.children ?? []) prune(child, shown ? depth + 1 : depth, out);

  return out;
}

/** Every font family a tree renders, for the self-check that the locale really switched. */
export function fontsIn(
  node: ReactTestRendererJSON | string,
  out = new Set<string>(),
): Set<string> {
  if (typeof node === 'string') return out;

  const family = flatten(node.props.style).fontFamily;

  if (node.type === 'Text' && family) out.add(String(family));
  for (const child of node.children ?? []) fontsIn(child, out);

  return out;
}

const isInter = (family: string) => family.startsWith('Inter-');

/** E8's R-A guard, the strongest assertion in the suite: English renders Inter, Arabic renders none, or this fails. */
export function expectLocaleFonts(trees: Record<Locale, ReactTestRendererJSON>) {
  const ar = [...fontsIn(trees.ar)];
  const en = [...fontsIn(trees.en)];

  expect({
    arabicRendersInter: ar.some(isInter),
    englishRendersInter: en.some(isInter),
  }).toEqual({
    arabicRendersInter: false,
    englishRendersInter: true,
  });
}

/** True when any Text in the tree holds Arabic script. */
export function hasArabic(node: ReactTestRendererJSON | string): boolean {
  if (typeof node === 'string') return /[؀-ۿ]/.test(node);

  return (node.children ?? []).some(hasArabic);
}

/** Every string a person can read or hear: each Text's own strings, and every a11y label. */
function renderedStrings(
  node: ReactTestRendererJSON | string,
  out: string[] = [],
): string[] {
  if (typeof node === 'string') return out;

  const label = node.props.accessibilityLabel;
  if (typeof label === 'string') out.push(label);

  if (node.type === 'Text') {
    const own = (node.children ?? []).filter(child => typeof child === 'string').join('');
    if (own) out.push(own);
  }
  for (const child of node.children ?? []) renderedStrings(child, out);

  return out;
}

/** The shape of a catalogue address: `tracker.lastStep`, `e03.slot.0700`. Copy never has it. */
const KEY_SHAPE = /^[a-z][a-z0-9]*(?:\.[A-Za-z0-9]+)+$/;

/** E9: no rendered string may be a catalogue key (W1's bug) or hold a literal backslash (a typed `\n` from the deck). */
export function expectNoKeysOrEscapes(trees: Record<Locale, ReactTestRendererJSON>) {
  const offenders: string[] = [];

  for (const locale of ['ar', 'en'] as const) {
    for (const value of renderedStrings(trees[locale])) {
      if (KEY_SHAPE.test(value.trim()))
        offenders.push(locale + ' key-shaped: ' + JSON.stringify(value));
      if (value.includes('\\'))
        offenders.push(locale + ' backslash: ' + JSON.stringify(value));
    }
  }

  expect(offenders).toEqual([]);
}

export const snapshotOf = (trees: Record<Locale, ReactTestRendererJSON>) => {
  expectNoKeysOrEscapes(trees);

  return {
    ar: prune(trees.ar).join('\n'),
    en: prune(trees.en).join('\n'),
  };
};

/** Inter carries no Arabic and Android silently falls back to a system face, so no Arabic Text may be set in Inter. */
export function expectNoArabicInInter(trees: Record<Locale, ReactTestRendererJSON>) {
  const offenders: string[] = [];
  const visit = (node: ReactTestRendererJSON | string) => {
    if (typeof node === 'string') return;

    const own = (node.children ?? []).filter(child => typeof child === 'string').join('');
    const family = String(flatten(node.props.style).fontFamily ?? '');

    if (node.type === 'Text' && isInter(family) && /[؀-ۿ]/.test(own)) {
      offenders.push(family + ' ' + JSON.stringify(own));
    }
    for (const child of node.children ?? []) visit(child);
  };

  visit(trees.ar);
  visit(trees.en);
  expect(offenders).toEqual([]);
}
