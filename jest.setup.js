// Mocks the native modules the app imports at load time; without them importing App.tsx throws.

require('react-native-gesture-handler/jestSetup');

// Reanimated 4's own mock needs the worklets binary, so mock the surface directly instead.
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

// v5 reaches for the Nitro TurboModule on import; mocking the camera short-circuits that chain.
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

// photoStore imports nitro-image directly, past the camera mock, so it needs its own round trip.
jest.mock('react-native-nitro-image', () => {
  const makeImage = (width, height, buffer) => ({
    width,
    height,
    resizeAsync: jest.fn((w, h) => Promise.resolve(makeImage(w, h, buffer))),
    toEncodedImageDataAsync: jest.fn(() =>
      Promise.resolve({ buffer, width, height, imageFormat: 'jpg' }),
    ),
    saveToTemporaryFileAsync: jest.fn(() => Promise.resolve('/mock/tmp/restored.jpg')),
    saveToFileAsync: jest.fn(() => Promise.resolve()),
  });

  return {
    __esModule: true,
    Images: {
      loadFromFileAsync: jest.fn(() =>
        Promise.resolve(makeImage(2048, 1536, new Uint8Array([1, 2, 3, 4, 5]).buffer)),
      ),
      loadFromEncodedImageDataAsync: jest.fn(data =>
        Promise.resolve(makeImage(data.width, data.height, data.buffer)),
      ),
    },
  };
});

// Native module with no JS fallback. Resolves a fix at once so useCurrentLocation has one.
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

// Ships no jest mock of its own; hide() is the only API the app calls.
jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockResolvedValue(false),
  useHideAnimation: jest.fn(),
}));

// Untranspiled ESM that throws on import, so mock it; tests that drive the flow override these defaults.
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

// Its own mock, defaulting to connected. The queue's tests override it; this stops others hanging.
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);

// v3 API surface (getMany/setMany/removeMany, not the removed multi* names).
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

// Native views that render nothing. Map forwards children, since the pins are what tests assert on.
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = name =>
    React.forwardRef((props, ref) =>
      React.createElement(View, { ...props, ref, testID: props.testID ?? name }),
    );

  return {
    __esModule: true,
    Map: passthrough('Map'),
    Camera: passthrough('Camera'),
    Marker: passthrough('Marker'),
    UserLocation: passthrough('UserLocation'),
    RasterSource: passthrough('RasterSource'),
    Layer: passthrough('Layer'),
    Images: passthrough('Images'),
    GeoJSONSource: passthrough('GeoJSONSource'),
    ViewAnnotation: passthrough('ViewAnnotation'),
    Callout: passthrough('Callout'),
    LocationManager: { start: jest.fn(), stop: jest.fn() },
    LogManager: { setLogLevel: jest.fn() },
  };
});

// No test may reach the network; rejecting like a dead connection maps to client.ts's offline ApiError.
global.fetch = jest.fn(() => Promise.reject(new TypeError('Network request failed')));
