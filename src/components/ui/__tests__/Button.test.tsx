import { createElement } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { act, create } from 'react-test-renderer';

import type { TextStyle } from 'react-native';

type Rendered = { fontSize?: number; lineHeight?: number; fontFamily?: string };

// Label size follows script (SPEC §16.6/E8), resolved at module init, so the English case needs its own module registry rather than a runtime setLocale.
function labelStyle(
  forced: 'en' | null,
  script?: 'ar' | 'en',
  variant?: 'ghost',
): Rendered {
  let style: TextStyle = {};

  jest.isolateModules(() => {
    jest.doMock('@/config/env', () => ({
      ...jest.requireActual('@/config/env'),
      FORCE_LOCALE: forced,
    }));

    const React = require('react');
    const renderer = require('react-test-renderer');
    const { Text } = require('react-native');
    const { Button } = require('../Button');
    let tree: ReturnType<typeof create> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(Button, { label: 'x', onPress: () => {}, script, variant }),
      );
    });
    style = StyleSheet.flatten(tree!.root.findByType(Text).props.style) as TextStyle;
  });
  jest.dontMock('@/config/env');

  return {
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fontFamily: style.fontFamily,
  };
}

describe('the button label size', () => {
  it('is h5 in Arabic and h4 in English, both in Cairo', () => {
    const arabic = labelStyle(null);
    const english = labelStyle('en');

    expect([arabic.fontSize, arabic.lineHeight]).toEqual([16, 24]);
    expect([english.fontSize, english.lineHeight]).toEqual([18, 30]);
    expect(english.fontFamily).toBe(arabic.fontFamily);
  });

  it('follows the label’s script over the active locale when told it', () => {
    // S-12's relaunch screen: written in the target language while the process runs the other.
    expect(labelStyle('en', 'ar').fontSize).toBe(16);
    expect(labelStyle(null, 'en').fontSize).toBe(18);
  });

  it('renders in the default registry without a script, which is every other call site', () => {
    let tree: ReturnType<typeof create> | undefined;
    const { Button } = require('../Button');

    act(() => {
      tree = create(createElement(Button, { label: 'x', onPress: () => {} }));
    });

    expect(StyleSheet.flatten(tree!.root.findByType(RNText).props.style)).toMatchObject({
      fontSize: 16,
    });
  });
});

// E10 / C38: a ghost Button inherited the filled buttons' label size where the frames draw a 14 link in both locales.
describe('the ghost button label', () => {
  it('is a 14 link in both locales, in the body face of each', () => {
    const arabic = labelStyle(null, undefined, 'ghost');
    const english = labelStyle('en', undefined, 'ghost');

    expect(arabic.fontSize).toBe(14);
    expect(english.fontSize).toBe(14);
    expect(arabic.fontFamily).toBe('NotoSansArabic-Regular');
    expect(english.fontFamily).toBe('Inter-Regular');
  });

  it('takes the face of its script when written in the other language', () => {
    // A body variant's family follows the ACTIVE locale, and Inter carries no Arabic.
    expect(labelStyle('en', 'ar', 'ghost').fontFamily).toBe('NotoSansArabic-Regular');
    expect(labelStyle(null, 'en', 'ghost').fontFamily).toBe('Inter-Regular');
  });

  it('is still a button to a screen reader', () => {
    const { Button } = require('../Button');
    let tree: ReturnType<typeof create> | undefined;

    act(() => {
      tree = create(
        createElement(Button, { label: 'x', variant: 'ghost', onPress: () => {} }),
      );
    });

    expect(
      tree!.root.findAllByProps({ accessibilityRole: 'button' }).length,
    ).toBeGreaterThan(0);
  });
});

// E9 / C14: the box a one-line label needs - its line box plus vertical padding, read off the rendered styles.
function oneLineBox(forced: 'en' | null): { needs: number; minHeight: number } {
  let label: TextStyle = {};
  let box: { minHeight?: number; paddingVertical?: number } = {};

  jest.isolateModules(() => {
    jest.doMock('@/config/env', () => ({
      ...jest.requireActual('@/config/env'),
      FORCE_LOCALE: forced,
    }));

    const React = require('react');
    const renderer = require('react-test-renderer');
    const { Text } = require('react-native');
    const { Button } = require('../Button');
    let tree: ReturnType<typeof create> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(Button, { label: 'x', onPress: () => {} }),
      );
    });
    label = StyleSheet.flatten(tree!.root.findByType(Text).props.style) as TextStyle;
    box = StyleSheet.flatten(
      tree!.root.findByProps({ accessibilityRole: 'button' }).props.style,
    ) as typeof box;
  });
  jest.dontMock('@/config/env');

  return {
    needs: (label.lineHeight ?? 0) + 2 * (box.paddingVertical ?? 0),
    minHeight: box.minHeight ?? 0,
  };
}

// C14: English's h4 18/30 (E8) once made every button 54dp against Arabic's 48dp; a one-line label must now fit controlHeight's floor, or this fails instead of quietly growing the box.
describe('the button height', () => {
  it('is held at controlHeight by a one-line label in both scripts', () => {
    const { controlHeight } = require('@/theme');

    for (const forced of [null, 'en'] as const) {
      const { needs, minHeight } = oneLineBox(forced);

      expect(minHeight).toBe(controlHeight);
      expect({ locale: forced ?? 'ar', fits: needs <= minHeight }).toEqual({
        locale: forced ?? 'ar',
        fits: true,
      });
    }
  });
});

// E10 / C45. F-02b's "Retake" and "Record again" draw their glyph AFTER the label in both frames.
describe('the button icon', () => {
  const order = (iconTrails: boolean) => {
    const { Button } = require('../Button');
    const { View } = require('react-native');
    let tree: ReturnType<typeof create> | undefined;

    act(() => {
      tree = create(
        createElement(Button, {
          label: 'x',
          onPress: () => {},
          icon: createElement(View, { testID: 'icon' }),
          iconTrails,
        }),
      );
    });

    const kinds = tree!.root
      .findAll(node => node.props.testID === 'icon' || node.type === RNText)
      .map(node => (node.type === RNText ? 'label' : 'icon'));

    return [...new Set(kinds)];
  };

  it('leads the label by default and trails it when asked', () => {
    expect(order(false)).toEqual(['icon', 'label']);
    expect(order(true)).toEqual(['label', 'icon']);
  });
});
