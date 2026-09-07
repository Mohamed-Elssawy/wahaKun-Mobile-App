module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // The preset resolves .svg as an asset, which is not a renderable element.
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
  // These ship untranspiled ESM, so they go through Babel rather than being ignored.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|@react-navigation' +
      '|react-native-.*' +
      '|lucide-react-native' +
      '|@gorhom' +
      '|@fortawesome' +
      ')/)',
  ],
};
