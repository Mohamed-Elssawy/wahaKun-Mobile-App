module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // These ship untranspiled ESM and must go through Babel rather than being
  // ignored like the rest of node_modules.
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
