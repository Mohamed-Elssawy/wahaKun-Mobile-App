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
title: { color: colors.textPrimary, marginTop: spacing.lg }
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

The UI is Arabic-first. RTL is expressed per-style with
`flexDirection: 'row-reverse'` and `textAlign: 'right'`, **not** via
`I18nManager.forceRTL`. Follow the existing pattern; don't mix approaches.

Latin-ish inputs — email, phone, password — stay `textAlign: 'left'` inside an
otherwise RTL screen.

Directional icons follow the reading direction: back is `ArrowRight`, forward is
`ArrowLeft`.

## Strings

Arabic copy is inline in JSX today. There is no i18n layer — adding one is a
project decision, not something to do halfway. Until then, keep user-facing
strings in the component that renders them, not scattered into helpers.

## API

- Screens never call `apiClient` directly — go through a feature service.
- **Backend DTO field names are copied verbatim, typos included**:
  `refershtoken`, `FulltName`, `ClinetUrl`, `ConfemedPassword`. These are not
  mistakes in this codebase; they match the C# DTOs and are the only spellings
  the server accepts. Do not "fix" them here.
- Catch `ApiError`, branch on `status` / `isNetworkError` / `isUnauthorized` —
  never on the message text.
- Always give the user an Arabic fallback message when the server doesn't
  provide one.

## Comments

Explain **why**, not what. Assume the reader can read code.

```ts
// ✗
// set loading to true
setIsLoading(true);

// ✓
// FormData sets its own multipart boundary — setting Content-Type manually
// destroys it and the server cannot parse the body.
```

Non-obvious constraints, backend quirks and deliberate deviations deserve a
comment. `useCountdown` explains why it doesn't list `secondsLeft` as a
dependency; `tokenStorage` explains why the v3 batch names matter. Keep that up.

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
