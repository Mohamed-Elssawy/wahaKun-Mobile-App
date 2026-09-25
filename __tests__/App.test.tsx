/** @format */

import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

test('renders correctly', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  // App holds null until firstRunStore answers, so a stalled boot gate would render nothing.
  expect(tree?.toJSON()).not.toBeNull();
});
