module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:import/recommended', 'plugin:import/typescript'],
  plugins: ['import'],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
  },
  rules: {
    // Fixed group order, so aliased and relative imports never interleave.
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'type',
        ],
        pathGroups: [
          { pattern: '@/**', group: 'internal', position: 'before' },
          { pattern: '@assets/**', group: 'internal', position: 'before' },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-duplicates': 'error',
    // Metro resolves these; the static resolver does not follow react-native
    // platform extensions or the svg transformer.
    'import/no-unresolved': 'off',

    // Enforces the design system: no raw colours or font names in styles.
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'Property[key.name=/^(color|backgroundColor|borderColor|tintColor|shadowColor)$/] > Literal[value=/^#|^rgb/]',
        message: 'Use a theme token from @/theme instead of a hard-coded colour.',
      },
      {
        selector: "Property[key.name='fontFamily'] > Literal",
        message: 'Use typography tokens from @/theme instead of a raw fontFamily string.',
      },
    ],

    'react-native/no-inline-styles': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'vendor/',
    'coverage/',
    '*.config.js',
    'jest.setup.js',
  ],
};
