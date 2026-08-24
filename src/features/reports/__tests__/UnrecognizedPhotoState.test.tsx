import { TouchableOpacity } from 'react-native';
import { act, create } from 'react-test-renderer';

import { UnrecognizedPhotoState } from '../components/UnrecognizedPhotoState';

import type { ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';

const render = (props: {
  onRetakePhoto: () => void;
  onUseVoice: () => void;
}): ReactTestRenderer => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<UnrecognizedPhotoState {...props} />);
  });
  return tree;
};

const textOf = (node: ReactTestInstance): string =>
  node.children.filter((child): child is string => typeof child === 'string').join('');

describe('UnrecognizedPhotoState', () => {
  const props = { onRetakePhoto: jest.fn(), onUseVoice: jest.fn() };

  beforeEach(() => {
    props.onRetakePhoto.mockReset();
    props.onUseVoice.mockReset();
  });

  it('says what the model could not do and what a readable photo looks like', () => {
    const tree = render(props);
    const strings = tree.root.findAllByType('Text' as never).map(textOf);

    expect(strings).toContain('لم نتمكن من رؤية مشكلة واضحة في الصورة');
    expect(strings).toContain('تأكد أن الصورة تُظهر مصدر المشكلة بوضوح');
  });

  /** The three labels are one sentence, so the row is only right in this order. */
  it('keeps the tips in reading order, right to left', () => {
    const tree = render(props);
    const strings = tree.root.findAllByType('Text' as never).map(textOf);
    const tips = ['تسرب أو قناة أو أنبوب', 'في ضوء جيد', 'وعن قرب'];

    expect(strings.filter(text => tips.includes(text))).toEqual(tips);
  });

  it('offers both ways forward and never a retry', () => {
    const tree = render(props);
    const buttons = tree.root.findAllByType(TouchableOpacity);

    expect(buttons).toHaveLength(2);

    act(() => buttons[0].props.onPress());
    expect(props.onRetakePhoto).toHaveBeenCalled();

    act(() => buttons[1].props.onPress());
    expect(props.onUseVoice).toHaveBeenCalled();
  });
});
