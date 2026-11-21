import { createElement } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { act, create } from 'react-test-renderer';

import { colors, controlHeight, switchSize } from '@/theme';

import { Switch } from '../Switch';

import type { ReactTestRenderer } from 'react-test-renderer';

function render(props: Partial<Parameters<typeof Switch>[0]> = {}) {
  let tree: ReactTestRenderer | undefined;

  act(() => {
    tree = create(
      createElement(Switch, {
        checked: false,
        onChange: () => {},
        accessibilityLabel: 'Critical area alerts',
        ...props,
      }),
    );
  });

  return tree!.root.findByType(TouchableOpacity);
}

// E10 c8: the a11y role, state, and touch target a custom switch is most likely to lose - none visible in a frame, so none caught by the walk.
describe('the switch as a control', () => {
  it('announces itself as a switch', () => {
    expect(render().props.accessibilityRole).toBe('switch');
  });

  it('announces checked, and follows the prop', () => {
    expect(render({ checked: false }).props.accessibilityState).toMatchObject({
      checked: false,
    });
    expect(render({ checked: true }).props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it('reaches a 48dp target from a 28dp track, without growing what is drawn', () => {
    const control = render();
    const { top, bottom } = control.props.hitSlop;
    const style = StyleSheet.flatten(control.props.style);

    expect(style.height).toBe(switchSize.trackHeight);
    expect(switchSize.trackHeight + top + bottom).toBe(controlHeight);
    expect(switchSize.trackWidth).toBeGreaterThanOrEqual(controlHeight);
  });

  it('reports the toggle it would make, not the state it is in', () => {
    const changes: boolean[] = [];

    render({ checked: true, onChange: next => changes.push(next) }).props.onPress();
    render({ checked: false, onChange: next => changes.push(next) }).props.onPress();

    expect(changes).toEqual([false, true]);
  });
});

// Thumb travels to the layout's END; S-07's frame shows both ON with the thumb at LEFT (an unmirrored export), so the side is asserted here, never read off a frame.
describe('the switch as a drawing', () => {
  it('sends the thumb to the end when checked and the start when not', () => {
    expect(StyleSheet.flatten(render({ checked: true }).props.style).justifyContent).toBe(
      'flex-end',
    );
    expect(
      StyleSheet.flatten(render({ checked: false }).props.style).justifyContent,
    ).toBe('flex-start');
  });

  it('fills the track green on and borderControl off, for 1.4.11', () => {
    expect(
      StyleSheet.flatten(render({ checked: true }).props.style).backgroundColor,
    ).toBe(colors.primary);
    expect(
      StyleSheet.flatten(render({ checked: false }).props.style).backgroundColor,
    ).toBe(colors.borderControl);
  });

  it('draws a thumb the token says, inset so it centres', () => {
    // The first View is the one TouchableOpacity renders for itself, carrying the track.
    const views = render().findAllByType(View);
    const thumb = StyleSheet.flatten(views[views.length - 1].props.style);

    expect([thumb.width, thumb.height]).toEqual([switchSize.thumb, switchSize.thumb]);
    expect(switchSize.thumb + switchSize.thumbInset * 2).toBe(switchSize.trackHeight);
  });
});
