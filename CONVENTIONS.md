# Conventions

House style for this repo. `npm run verify` enforces most of it; the rest is
review.

---

## The one rule

**Never hard-code a colour, font, size, radius or spacing value.** Import it
from `@/theme`.

```tsx
// ✗ ESLint error
title: { color: '#1F2223', fontFamily: 'Cairo-Regular', fontSize: 24 }

// ✓
<Text variant="h3">…</Text>
title: { color: colors.textPrimary, marginTop: spacing[24] }
```

Two `no-restricted-syntax` rules fail the build on raw colour literals and raw
`fontFamily` strings. They exist because the pre-refactor tree had 247
hard-coded hex values across 27 shades — for a palette of 13.

If a value genuinely isn't in the theme, add it to the theme. Don't inline it.

## Naming

| Thing                   | Style                            | Example                              |
| ----------------------- | -------------------------------- | ------------------------------------ |
| Component file & folder | `PascalCase`                     | `components/ui/Button.tsx`           |
| Screen folder           | `PascalCase` + `Screen`          | `screens/PhoneLoginScreen/index.tsx` |
| Hook                    | `camelCase`, `use` prefix        | `hooks/useCountdown.ts`              |
| Service                 | `camelCase` + `Service`          | `services/authService.ts`            |
| Non-component module    | `camelCase`                      | `api/tokenStorage.ts`                |
| Constants dir file      | `camelCase` plural               | `constants/countries.ts`             |
| Type / interface        | `PascalCase`                     | `RegistrationDraft`                  |
| Constant value          | `SCREAMING_SNAKE`                | `const OTP_LENGTH = 6`               |
| Route name              | `PascalCase`, matches its screen | `PhoneLogin`                         |
| Boolean                 | `is` / `has` / `should`          | `isVerifying`, `hasError`            |
| Handler                 | `handle` + event                 | `handleSubmit`                       |
| Handler prop            | `on` + event                     | `onCountryChange`                    |

Name a screen folder after what it does, not the order it appears in. Do not
abbreviate. The old tree had `LpginProcessScreens`, `EnterYourFallName` and
`SuccessedRegistration` — all three were typos that reached `import` paths.

## Imports

Use the `@/` alias for anything outside the current feature. Relative paths
only within a feature.

```tsx
import { Button, Screen, Text } from '@/components/ui'; // ✓
import { colors, spacing } from '@/theme'; // ✓
import { WizardHeader } from '../../components/WizardHeader'; // ✓ same feature
import { Button } from '../../../components/ui/Button'; // ✗
```

Group order is enforced by `import/order` and `--fix` will sort it: external →
`@/…` → `@assets/…` → relative → types.

Prefer `import type { … }` for type-only imports.

## Components

**Screens compose. Components present. Hooks do the work.**

A screen should read as layout. If it builds a request body, branches on an API
response, or manages a timer, that belongs in a hook.

```tsx
// ✗ business logic in the component
const handleNext = async () => {
  const formData = new FormData();
  formData.append('FullName', params.fullName);
  if (params.role === 'expert') { await createExpert(formData); … }
};

// ✓
const { submit, isSubmitting, error } = useRegistration();
```

A `components/ui/` primitive must not import from `features/`, call an API, or
touch navigation. If it needs any of those, it belongs in
`features/<name>/components/`.

**Before writing a new component, check `components/ui/`.** Nearly every screen
here is `Screen` + `WizardHeader`/`BackHeader` + `Text` + `TextField` +
`Button`. If you're writing a bordered input or a green pill button, it exists.

### Adding a screen

1. Add the route and its params to `RootStackParamList` in
   `navigation/types.ts`.
2. Create `features/<feature>/screens/<Name>Screen/index.tsx`, typed with
   `ScreenProps<'RouteName'>`.
3. Register it in `RootNavigator.tsx`.
4. `npm run verify`.

Never type screen props as `any`. That is exactly how seven `navigate()` calls
to unregistered routes shipped unnoticed.

## Styling

One `StyleSheet.create` per file, at the bottom, named `styles`. No inline style
objects except for genuinely dynamic values.

Layout only — colour and type come from `@/theme` or a `Text` variant.

### Right-to-left

The UI is Arabic-first and ships in two directions. Direction comes from
`I18nManager`, resolved once at boot from the locale — never per-style. Write
`flexDirection: 'row'` and let the direction do the work; a row runs start → end
and mirrors for free.

Use logical edges — `start`/`end`, `paddingStart`, not `left`/`right`. Order JSX
children in reading order, because that is what `'row'` lays out.

The `SPEC §6.7` LTR islands — phone numbers, the `+20` prefix, email, OTP boxes,
timers, report IDs, percentages, chat timestamps — are the only place a hard
direction belongs, and they keep it in **both** languages. A value interpolated
into an Arabic sentence uses `ltrIsolate()` instead.

On Android a physical `textAlign` is not a fixed edge. React Native swaps `left` and `right` on
text it lays out right to left, so `'right'` lands on the left in the Arabic UI. The style object
cannot show this: check where the glyphs land on a device (E8, `design/UI-CONFORMANCE.md` C47).

Directional icons come from `@/i18n/icons` — `BackIcon`, `ForwardIcon`,
`ForwardArrow`, `BackArrow`. Never name a side-specific glyph directly.

## Strings

User-facing copy comes from the catalogue: `t('key')`, and `tPlural(stem, count)`
for a count-dependent family. `src/i18n/ar.json` and `en.json` are generated from
`design/COPY-DECK.csv` by `scripts/i18n-deck.js` and are never hand-edited.

`t()` is a plain function, not a hook: the locale cannot change mid-session (SPEC §16.5
relaunches the app instead), so nothing ever has to re-render on a language change. Keys use the
SPEC's screen IDs (`s03.cta`, `f06.contactExpert`), so a key names the table that defines it.

**A `t()` call must sit inside a function body** — a function declaration, a
function expression or an arrow. SPEC §16.2 resolves the locale inside
`App.tsx`'s splash window, after the module graph is already built, so a call
evaluated during an import freezes whichever locale module init happened to see.
A default parameter is fine, because it is evaluated per call. A
`no-restricted-syntax` rule fails the build on a call at module scope, and it has
to be a rule rather than a habit: `FORCE_LOCALE='en'` lands at module init too,
so the dev setting built to make English visible is blind to exactly this bug.

Three shapes cover every extraction. `REFERENCE-NOTES.md` has the diffs; don't
invent a fourth.

| what you have                                       | what it becomes                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A module const read only inside a function          | Delete the const, inline `t('key')` at each read                                                           |
| A private map or array read by an exported function | The map holds keys; the function resolves them                                                             |
| Exported data rendered elsewhere                    | Keys in the table and an accessor function out, or a `labelKey` on the item and the `t()` in the component |

**Not every Arabic string is copy.** A value the code matches on is a token:
`scripts/i18n-wire.js` pins the ones syntax cannot tell from a label, and
translating one changes what the code means rather than what the farmer reads,
with no error anywhere. Content the app did not author — a comment, a voice
transcript, an AI diagnosis, a person's name — keeps the language it arrived in
and renders through `BiText`.

**A resolved string is never stored or sent.** If a value identifies something,
persist the id and look the copy up where it is read; a sentence written into
storage is frozen in the locale that wrote it. E4.1 in `REFERENCE-NOTES.md` is
what that costs.

## API

- Screens never call `apiClient` directly — go through a feature service.
- **Backend DTO field names are copied verbatim, typos included**:
  `refershtoken`, `FulltName`, `ClinetUrl`, `ConfemedPassword`. These are not
  mistakes in this codebase; they match the C# DTOs and are the only spellings
  the server accepts. Do not "fix" them here.
- Catch `ApiError`, branch on `status` / `isNetworkError` / `isUnauthorized` —
  never on the message text.
- Always give the user a catalogue fallback message, a `t()` key, when the
  server doesn't provide one, so it reaches them in their own language.

## Comments

Explain **why**, not what. Assume the reader can read code.

**One line, always.** If a comment needs a second line, either shrink it or move
it into ARCHITECTURE.md. Long block comments go stale and nobody reads them.

```ts
// ✗
// set loading to true
setIsLoading(true);

// ✗ needs a paragraph, so it belongs in a doc
/**
 * FormData sets its own multipart boundary. Setting Content-Type manually
 * destroys it, and the server then cannot parse the body, which shows up as
 * a 400 with no useful detail...
 */

// ✓
// Setting Content-Type on FormData destroys the boundary and the body will not parse.
```

Non-obvious constraints, backend quirks and deliberate deviations deserve a
comment. `useCountdown` explains why it doesn't list `secondsLeft` as a
dependency; `tokenStorage` explains why the v3 batch names matter. Keep that up.

No section banners, no decorative separators, no emoji. Doc comments belong on
shared utilities, the API layer and the theme system, not on every component.
A `TODO` is fine when it is specific and names what would resolve it.

## Commits

Conventional Commits: `type(scope): summary`.

Types: `feat` `fix` `refactor` `chore` `build` `docs` `test`.
Scopes: the feature or layer — `auth`, `onboarding`, `ui`, `api`, `theme`,
`navigation`.

Say what changed and **why it was wrong before**. One logical change per
commit — a rename and a bug fix are two commits.

## Before pushing

```sh
npm run verify    # typecheck + lint + test
```

Zero errors. Warnings are acceptable only if you can explain them.
