/**
 * Jest setup — mocks the native modules the app pulls in at import time.
 *
 * Anything here is a module whose TurboModule/native binary does not exist in
 * the Node test environment. Without these, simply importing App.tsx throws
 * before a single assertion runs.
 */

require('react-native-gesture-handler/jestSetup');

// Reanimated 4's own mock imports react-native-worklets, which needs the
// native binary — so mock the surface directly instead of using it.
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: { View, Text: View, ScrollView: View, createAnimatedComponent: c => c },
    useSharedValue: jest.fn(v => ({ value: v })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedScrollHandler: jest.fn(() => jest.fn()),
    withTiming: jest.fn(v => v),
    withSpring: jest.fn(v => v),
    runOnJS: jest.fn(fn => fn),
    Easing: { linear: jest.fn(), ease: jest.fn(), bezier: jest.fn(() => jest.fn()) },
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: View,
    BottomSheetView: View,
    BottomSheetModal: View,
  };
});

// Ships no jest mock of its own — hide() is the only API the app calls.
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockResolvedValue(false),
  useHideAnimation: jest.fn(),
}));

// v3 API surface (getMany/setMany/removeMany — not the removed multi* names).
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    getMany: jest.fn().mockResolvedValue({}),
    setMany: jest.fn().mockResolvedValue(undefined),
    removeMany: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));
