import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

/**
 * The boot gate waits on the route and the locale together, so an unsettled Promise.all would
 * hold bootRoute at null forever - a blank screen behind a splash that has already been hidden.
 * Mocked at module scope rather than with resetModules, which would hand App a second copy of
 * React and fail on the dispatcher instead of on the thing under test.
 */
jest.mock('@/i18n', () => ({
  // Spread the real module: theme/typography.ts reads locale() at module init, so a mock that
  // carries resolveLocale alone takes out every screen before the boot gate is even reached.
  ...jest.requireActual('@/i18n'),
  resolveLocale: () => Promise.reject(new Error('AsyncStorage unavailable')),
}));

test('still boots when the locale resolution rejects', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  expect(tree?.toJSON()).not.toBeNull();
});
