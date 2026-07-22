module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.svg'],
        alias: {
          '@': './src',
          '@assets': './assets',
        },
      },
    ],
    // Must stay last — the worklets plugin has to see the final AST.
    'react-native-worklets/plugin',
  ],
};
