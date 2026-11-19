const COPY_PROPS = require('./scripts/i18n-copy-props');
const I18N_EXCLUDE = require('./scripts/i18n-exclude');
const I18N_PERMANENT = require('./scripts/i18n-permanent');

// Enforces the design system: no raw colours or font names in styles.
const STYLE_SELECTORS = [
  {
    selector:
      'Property[key.name=/^(color|backgroundColor|borderColor|tintColor|shadowColor)$/] > Literal[value=/^#|^rgb/]',
    message: 'Use a theme token from @/theme instead of a hard-coded colour.',
  },
  {
    selector: "Property[key.name='fontFamily'] > Literal",
    message: 'Use typography tokens from @/theme instead of a raw fontFamily string.',
  },
];

// SPEC §16.3: direction comes from I18nManager, resolved at boot from the locale. A style that
// names a physical side freezes one direction and double-mirrors under the other, which is the
// bug E2 removed. These are separate from STYLE_SELECTORS so the LTR-island override below can
// drop them without also dropping the colour and font rules.
const DIRECTION_SELECTORS = [
  {
    selector: "Property[key.name='flexDirection'] > Literal[value='row-reverse']",
    message:
      "Direction comes from I18nManager, not the style. Use 'row' and order the children by reading order (SPEC §16.3).",
  },
  {
    selector: "Property[key.name='textAlign'] > Literal[value='right']",
    message:
      "textAlign 'right' freezes direction. Drop it and let the default follow the locale.",
  },
  {
    selector: "JSXAttribute[name.name='align'] > Literal[value='right']",
    message:
      'align="right" freezes direction. Drop the prop; the default already follows it.',
  },
];

// The other half of the rule: a hard direction is legal only inside a SPEC §6.7 LTR island, and
// only in the files the allowlist names. Everywhere else these are the same bug as the three
// above, in the opposite direction.
const LTR_ISLAND_SELECTORS = [
  {
    selector: "Property[key.name='textAlign'] > Literal[value='left']",
    message: "A hard 'left' belongs only to a SPEC §6.7 LTR island.",
  },
  {
    selector: "Property[key.name='direction'] > Literal[value='ltr']",
    message: 'Pinning direction belongs only to a SPEC §6.7 LTR island.',
  },
  {
    selector: "Property[key.name='writingDirection'] > Literal[value='ltr']",
    message: 'Pinning writingDirection belongs only to a SPEC §6.7 LTR island.',
  },
];

// SPEC §6.7's island list, mapped to the files that render each one. Phone numbers and the +20
// prefix · email · OTP boxes · countdown timers · report IDs · percentages · chat timestamps.
// A value interpolated into an Arabic sentence uses ltrIsolate() instead and needs no exemption.
const LTR_ISLANDS = [
  'src/components/ui/OtpInput.tsx',
  'src/components/ui/PhoneField.tsx',
  'src/components/ui/TextField.tsx',
  'src/components/ui/ConfidencePill.tsx',
  'src/components/ui/ConfidenceRing.tsx',
  'src/features/community/components/FeedCardCounters.tsx',
  'src/features/notifications/components/NotificationRow.tsx',
  'src/features/reports/components/VoiceRecordingCard.tsx',
];

// The generated list that lifts the Arabic rule: files whose Arabic is not copy and never will
// be. Asked through one predicate because an override REPLACES a rule's config rather than
// merging into it, so a file appearing later with ARABIC_SELECTOR restated silently loses the
// exemption an earlier block gave it. (E1-E6 had a second, pending list here; E8 deleted it once
// the last wave emptied it.)
const holdsArabic = file => I18N_PERMANENT.includes(file);

/** An override with no files is a config ERROR, not a no-op, so an empty one is left out. */
const withFiles = (files, rules) => (files.length ? [{ files, rules }] : []);

// The three function-like nodes a t() call can sit inside. An object method, a class method,
// a getter and a setter all hold a FunctionExpression, so these three cover every body.
const FUNCTION_NODES = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];

/**
 * SPEC §16.2: the locale is resolved ONCE, inside App.tsx's splash window, from AsyncStorage.
 * The module graph is built before that await settles, so a t() call evaluated while a module
 * is being imported reads whatever locale was set at module init - FORCE_LOCALE, or 'ar' - and
 * freezes it. A farmer whose stored locale is 'en' then reads Arabic error copy.
 *
 * E4 found 157 of this wave's 302 literals at module scope, so this is the common shape and not
 * an edge. The reason it needs a gate rather than a note: under FORCE_LOCALE='en' the override
 * lands at module init too, so a module-scope call DOES return English and the dev setting built
 * to make English visible is blind to exactly this defect. E5 and E6 have ~900 more strings of
 * the same kind behind them.
 *
 * The fix at a call site is always to move the call into the function that reads it, never to
 * assign it to a const earlier. A default parameter is fine - it is evaluated per call.
 *
 * ONE KNOWN BLIND SPOT, pinned by scripts/__tests__/i18n-lint-scope.test.js: the selector asks
 * where a call SITS, not when it RUNS, so `const x = [1, 2].map(n => t('k') + n)` at module
 * scope passes and still freezes the locale, because the callback is invoked immediately. That
 * is why Phase 3 of every extraction wave must include one run with a PERSISTED locale and no
 * FORCE_LOCALE override - the only configuration in which a frozen string shows itself.
 */
const T_SCOPE_SELECTOR = {
  selector:
    'CallExpression[callee.name=/^(t|tPlural)$/]' +
    FUNCTION_NODES.map(node => `:not(${node} CallExpression)`).join(''),
  message:
    'A t() call at module scope freezes the locale: §16.2 resolves it after the module graph ' +
    'is built. Move the call into the function that reads it.',
};

// SPEC §16: no Arabic-script literal outside src/i18n. Four node shapes:
//   - JSXText, because a string can be a JSX child rather than an attribute.
//   - Identifier, added in E8. A single-word Arabic object key (`حرجة: 'critical'`) parses as an
//     Identifier while a multi-word one must be quoted and parses as a Literal, so the line
//     between the two is orthographic. esquery matches an Identifier by name perfectly well;
//     before E8 the selector simply never listed the shape. It matched 13 when added - exactly
//     the 8 keys of search.ts's fold table and the 5 of severity.ts's wire tiers, both exempt -
//     so nothing reaches those keys by dot-notation from a file the rule covers.
//   - :not([regex]) is load-bearing: an ESTree regex literal is a Literal too and esquery
//     stringifies its value, so /[Arabic-Indic]/ would fail the rule.
// The range is the one scripts/i18n-ast.js scans: the Arabic block, the supplement and both
// presentation-form blocks. The basic block alone let a pasted presentation-form string through.
const ARABIC = '[\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF]';

const ARABIC_SELECTOR = {
  selector: [
    `Literal[value=/${ARABIC}/]:not([regex])`,
    `TemplateElement[value.cooked=/${ARABIC}/]`,
    `JSXText[value=/${ARABIC}/]`,
    `Identifier[name=/${ARABIC}/]`,
  ].join(', '),
  message: "Arabic copy belongs in src/i18n. Use t('key').",
};

// The other half of the copy gate: a Latin word written straight into the UI. Copy reaches the
// screen two ways - as a JSX child, and through a prop that carries it, which is how most of it
// travels here (scripts/i18n-copy-props.js). A LETTER is what makes a literal copy, so the
// punctuation joins this tree uses (`— ${t('…')}`, `{percent}%`) pass without an allow-list, and
// so does a bare email address, which is SPEC §6.7 island data rather than prose.
//
// Not react/jsx-no-literals: its default mode is bypassed by wrapping the string in braces, and its
// own message tells you to do exactly that; its strict mode flags punctuation joins no
// allowedStrings entry can match; and its message cannot say "use t('key')".
//
// Known limit: copy passed inside an OBJECT prop (`action={{ label: 'Retry' }}`) is not seen,
// because object properties also hold catalogue keys as data (`title: 'f01.emptyTitle'`).
const LATIN = '[A-Za-z]';
const CHILD = ':matches(JSXElement, JSXFragment) > JSXExpressionContainer';
const COPY_PROP = `JSXAttribute[name.name=/^(${COPY_PROPS.join('|')})$/]`;
const NOT_EMAIL = ':not([value=/^[^\\s@]+@[^\\s@]+$/])';

const ENGLISH_SELECTOR = {
  selector: [
    `JSXText[value=/${LATIN}/]`,
    `${CHILD} > Literal[value=/${LATIN}/]`,
    `${CHILD} > :matches(ConditionalExpression, LogicalExpression) > Literal[value=/${LATIN}/]`,
    `${CHILD} > TemplateLiteral > TemplateElement[value.cooked=/${LATIN}/]`,
    `${COPY_PROP} > Literal[value=/${LATIN}/]${NOT_EMAIL}`,
    `${COPY_PROP} > JSXExpressionContainer > Literal[value=/${LATIN}/]${NOT_EMAIL}`,
    `${COPY_PROP} > JSXExpressionContainer > :matches(ConditionalExpression, LogicalExpression) > Literal[value=/${LATIN}/]`,
    `${COPY_PROP} > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.cooked=/${LATIN}/]`,
  ].join(', '),
  message: "UI copy belongs in src/i18n. Use t('key').",
};

// BiText is the implementation of L-CONTENT-ALIGN: it resolves a block's direction from the
// content and gives the paragraph that Yoga `direction`, which is the one case a direction is
// derived rather than frozen against the locale. Permanent, not pending.
//
// E9 changed which selector it lifts. It used to set a physical textAlign plus `writingDirection`,
// and lifted the writingDirection rule; Android swaps the first and ignores the second, so the
// glyphs landed on the wrong edge while the style object read correctly. It now sets
// `direction: 'ltr' | 'rtl'` and nothing else, so `direction` is the selector lifted. Every other
// selector stays, including textAlign 'left'/'right' and writingDirection: BiText needs none.
const BITEXT = 'src/components/ui/BiText.tsx';

const BITEXT_SELECTORS = LTR_ISLAND_SELECTORS.filter(
  rule => !rule.selector.includes("key.name='direction'"),
);

// no-restricted-syntax takes one severity for the whole rule, and an override replaces a rule's
// config rather than merging into it. Composing the arrays is what lets each block lift exactly
// one rule and keep the rest. EXEMPT lifts the Arabic rule only: a fixture or a wire value may
// hold Arabic, but an English literal in one of those files is still an English literal.
const EXEMPT = {
  rules: {
    'no-restricted-syntax': [
      'error',
      T_SCOPE_SELECTOR,
      ...STYLE_SELECTORS,
      ...DIRECTION_SELECTORS,
      ...LTR_ISLAND_SELECTORS,
      ENGLISH_SELECTOR,
    ],
  },
};

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
    // Metro resolves these; the static resolver follows neither platform extensions nor svg.
    'import/no-unresolved': 'off',
    // AsyncStorage, Svg and BootSplash all re-export their default under its own name.
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',

    'no-restricted-syntax': [
      'error',
      T_SCOPE_SELECTOR,
      ...STYLE_SELECTORS,
      ...DIRECTION_SELECTORS,
      ...LTR_ISLAND_SELECTORS,
    ],

    'react-native/no-inline-styles': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
  overrides: [
    {
      // App source only. The rule says "use t('key')", which is advice for a screen and
      // nonsense for scripts/probe/findings.js, where the Arabic is recorded backend data.
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'no-restricted-syntax': [
          'error',
          T_SCOPE_SELECTOR,
          ...STYLE_SELECTORS,
          ...DIRECTION_SELECTORS,
          ...LTR_ISLAND_SELECTORS,
          ARABIC_SELECTOR,
          ENGLISH_SELECTOR,
        ],
      },
    },
    {
      // The layer owns the catalogues. relativeTime.ts holds both locales' relative-time,
      // weekday and month tables in code, on the plural engine, because SPEC §16.7 decided this
      // vocabulary stays out of the catalogue - so its exemption is permanent, not pending.
      // Fixtures stay bilingual by design (RULEBOOK §8).
      files: [
        'src/i18n/**',
        'src/features/reports/relativeTime.ts',
        'src/__fixtures__/**',
      ],
      ...EXEMPT,
    },
    {
      // Arabic that is not copy and never will be: a wire value pinned in scripts/i18n-wire.js,
      // a fixture, a mock, a test's assertion. Generated by scripts/i18n-extract.js.
      //
      // A file-level exemption cannot see a NEW chrome literal added to one of these files, so
      // scripts/__tests__/i18n-pipeline.test.js runs the extractor's own classifier over them
      // and fails on any. Before E8 the pending list was that detector, and only when someone
      // re-ran the extractor and read the diff.
      files: I18N_PERMANENT,
      ...EXEMPT,
    },
    // SPEC §6.7's islands keep a hard direction in both locales, so only these files may name
    // one. The direction rules still apply to them; only the island half is lifted.
    //
    // Split by whether the island holds permanent Arabic, because an override replaces a rule's
    // config rather than merging into it: such an island would otherwise have its exemption
    // revoked by sitting later in this list.
    //
    // SPREAD, not listed, because ESLint rejects an override whose `files` is empty - and E5
    // emptied the second one by extracting the last island that still held Arabic. That config
    // error does not read as a lint failure: `eslint` exits before it checks anything, so a
    // grep for problems finds none and the run looks clean.
    ...withFiles(LTR_ISLANDS.filter(file => !holdsArabic(file)), {
      'no-restricted-syntax': [
        'error',
        T_SCOPE_SELECTOR,
        ...STYLE_SELECTORS,
        ...DIRECTION_SELECTORS,
        ARABIC_SELECTOR,
        ENGLISH_SELECTOR,
      ],
    }),
    ...withFiles(LTR_ISLANDS.filter(holdsArabic), {
      'no-restricted-syntax': [
        'error',
        T_SCOPE_SELECTOR,
        ...STYLE_SELECTORS,
        ...DIRECTION_SELECTORS,
        ENGLISH_SELECTOR,
      ],
    }),
    {
      // The L-CONTENT-ALIGN exemption, scoped to the one file rather than a glob. Overrides
      // replace a rule's config instead of merging into it, so every selector kept is restated.
      files: [BITEXT],
      rules: {
        'no-restricted-syntax': [
          'error',
          T_SCOPE_SELECTOR,
          ...STYLE_SELECTORS,
          ...DIRECTION_SELECTORS,
          ...BITEXT_SELECTORS,
          ARABIC_SELECTOR,
          ENGLISH_SELECTOR,
        ],
      },
    },
    {
      // Files whose Arabic is not copy at all, from the one hand-maintained list
      // scripts/i18n-extract.js also reads. This is not tidiness: the extractor generates both
      // lists above, and a file it excludes has no rows, so it appears on neither and the
      // Arabic rule starts erroring on it. Both of these have held Arabic since before the rule
      // existed. (I18N_PERMANENT is the generated cousin of this list: same exemption, derived
      // rather than declared, for Arabic the classifier can already see is not copy.)
      //
      // LAST in the list, because an override replaces a rule's config rather than merging
      // into it, so anything after this could silently revoke the exemption. An excluded file
      // that is ALSO a SPEC 6.7 island would need the island half composed in here too;
      // neither of the current two is one.
      //
      // The one block that lifts the English rule as well: the wordmark's Latin half, `Waha KUN`,
      // is a brand asset in BrandLockup.tsx for the same reason its Arabic half is.
      files: I18N_EXCLUDE,
      rules: {
        'no-restricted-syntax': [
          'error',
          T_SCOPE_SELECTOR,
          ...STYLE_SELECTORS,
          ...DIRECTION_SELECTORS,
          ...LTR_ISLAND_SELECTORS,
        ],
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'vendor/',
    'coverage/',
    '*.config.js',
    'jest.setup.js',
    // Figma plugins run in Figma's sandbox, where none of the React Native config applies.
    'tools/',
  ],
};
