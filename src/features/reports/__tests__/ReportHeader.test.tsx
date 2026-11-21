import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, create } from 'react-test-renderer';

import { t } from '@/i18n';

import { ReportHeader } from '../components/ReportHeader';

import type { ComponentProps } from 'react';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 24, left: 0, right: 0, bottom: 0 },
};

function render(props: Partial<ComponentProps<typeof ReportHeader>>) {
  let tree: ReturnType<typeof create> | undefined;

  act(() => {
    tree = create(
      <SafeAreaProvider initialMetrics={metrics}>
        <ReportHeader title={t('x02.analysingTitle')} {...props} />
      </SafeAreaProvider>,
    );
  });

  return tree!.root;
}

// Host nodes only: the composite TouchableOpacity carries the same props a second time.
const backButtons = (props: Partial<ComponentProps<typeof ReportHeader>>) =>
  render(props).findAll(
    node => typeof node.type === 'string' && node.props.accessibilityRole === 'button',
  );

// E10 / C34: the app omitted X-02's chevron entirely instead of drawing it disabled per the SPEC.
describe("the report header's back chevron", () => {
  it('is absent when there is nowhere to go back to', () => {
    expect(backButtons({})).toHaveLength(0);
  });

  it('is drawn and live when given a way back', () => {
    const onBack = jest.fn();
    const root = render({ onBack });
    const [touchable] = root.findAll(node => node.props.onPress === onBack);

    expect(touchable.props.disabled).toBe(false);
    act(() => touchable.props.onPress());
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('is drawn but inert while the model runs, and says so to a screen reader', () => {
    const [button, ...rest] = backButtons({ isBackDisabled: true });

    expect(rest).toHaveLength(0);
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });
});
