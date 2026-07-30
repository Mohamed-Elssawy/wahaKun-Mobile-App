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

// v5 (Nitro) reaches for the native NitroModules TurboModule at import time,
// which doesn't exist under Node. Mocking VisionCamera short-circuits the whole
// vision-camera → nitro-modules chain, so nitro needs no separate mock.
jest.mock('react-native-vision-camera', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    Camera: View,
    useCameraDevice: jest.fn(() => ({ id: 'mock-back', position: 'back' })),
    useCameraPermission: jest.fn(() => ({
      hasPermission: true,
      requestPermission: jest.fn().mockResolvedValue(true),
    })),
    usePhotoOutput: jest.fn(() => ({
      capturePhoto: jest.fn().mockResolvedValue({ path: '/mock/photo.jpg' }),
      capturePhotoToFile: jest.fn().mockResolvedValue({ filePath: '/mock/photo.jpg' }),
    })),
  };
});

// Native module with no JS fallback. Resolves a fix immediately so
// useCurrentLocation has something to narrow.
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    getCurrentPosition: jest.fn(onSuccess =>
      onSuccess({
        coords: { latitude: 29.2041, longitude: 25.5195 },
        timestamp: 0,
      }),
    ),
    requestAuthorization: jest.fn(),
    setRNConfiguration: jest.fn(),
  },
}));

// Ships no jest mock of its own — hide() is the only API the app calls.
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockResolvedValue(false),
  useHideAnimation: jest.fn(),
}));

// Ships untranspiled ESM and is not matched by transformIgnorePatterns, so
// importing the real module throws "Cannot use import statement outside a
// module" — and there is no JS fallback for phone verification regardless.
// Mocking it also means transformIgnorePatterns needs no entry, because the real
// module is never loaded. Tests that drive the flow override these per case; the
// defaults exist so a suite that merely imports the auth hooks keeps working.
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  getAuth: jest.fn(() => ({ app: { name: '[DEFAULT]' } })),
  signInWithPhoneNumber: jest.fn().mockResolvedValue({
    verificationId: 'test-verification-id',
    confirm: jest.fn().mockResolvedValue({
      user: { getIdToken: jest.fn().mockResolvedValue('test-id-token') },
    }),
  }),
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
