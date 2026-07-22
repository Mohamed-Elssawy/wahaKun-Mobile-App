# Architecture

## Layers

The codebase is feature-sliced with a shared foundation underneath. Imports flow
**downward only**:

```
             app/            root providers + navigator mount
               │
             navigation/     route table, param types, placeholders
               │
             features/       auth · onboarding · user
               │             (screens, feature components, hooks, services)
               │
   ┌───────────┼───────────┬──────────────┐
   │           │           │              │
components/   hooks/    constants/     types/     cross-feature shared code
   │
 theme/       api/      config/                   foundation
```

Rules that keep this honest:

- `theme/`, `api/` and `config/` import nothing from `features/`.
- `components/ui/` is presentational: no API calls, no navigation, no feature
  imports.
- A feature may import another feature's **services and types** (onboarding uses
  `features/auth/services/authService` to register). It may not import another
  feature's screens.
- Only `features/*/screens/` and `app/` know about navigation.

## Directory map

```
src/
  api/                 HTTP transport, shared by every feature
    client.ts            fetch wrapper: timeouts, auth header, error mapping
    errors.ts            ApiError (status, isNetworkError, isUnauthorized)
    endpoints.ts         route paths, 1:1 with the .NET controllers
    tokenStorage.ts      access/refresh tokens in AsyncStorage
  app/
    App.tsx              GestureHandler → SafeArea → Registration → Navigator
  components/ui/       design-system primitives (see CONVENTIONS.md)
  config/
    env.ts               host, ports, base URLs, timeout
    env.local.ts         gitignored per-machine HOST_OVERRIDE
  constants/           countries, governorates, areas
  features/
    auth/                login flows + all AuthService bindings
      hooks/               useLogin, useOtpVerification
      screens/             PhoneLogin, LoginOtp, EmailLogin
      services/            authService.ts
      types.ts             DTOs mirroring the backend
    onboarding/          the 7-step registration wizard
      components/          WizardHeader, ActionCard
      context/             RegistrationContext (the in-progress draft)
      hooks/               useImagePicker, useRegistration
      screens/             Welcome … RegistrationSuccess
    user/                UserService bindings
  hooks/               useCountdown — app-wide, feature-agnostic
  navigation/
    RootNavigator.tsx    the single stack
    types.ts             RootStackParamList — the source of routing truth
    PlaceholderScreen.tsx
  theme/               colors, typography, layout — generated from Figma
  types/               shared domain types
```

### Why `tokenStorage` sits in `api/`, not `features/auth/`

The HTTP client reads the access token to sign requests. If token storage lived
in the auth feature, `api/` would import `features/`, inverting the layering and
creating a cycle. It's transport state, so it lives with transport.

### Why the registration wizard is its own feature

`onboarding/` owns the sign-up flow; `auth/` owns login and every AuthService
binding. The split follows the Figma IA ("Profile Setup" vs "Log in") and keeps
`auth/` reusable by future features that need the session without pulling in
seven wizard screens. Onboarding depends on auth's services, one-directionally.

## Data flow

### A screen making a request

```
Screen  ──▶  feature hook  ──▶  feature service  ──▶  api/client
(state,      (orchestration,     (endpoint +          (headers, timeout,
 render)      loading, error)     DTO shape)           ApiError mapping)
```

Screens never call `apiClient` directly and never build request bodies. They
render, hold local form state, and react to what a hook returns.

`useRegistration` is the clearest example: it owns the FormData build and the
farmer-vs-expert endpoint branch, so `PhoneScreen` only decides where to
navigate based on the outcome it gets back.

### Errors

Everything the API layer throws is an `ApiError`. `client.ts` maps non-2xx
responses (pulling `message`/`title`/`error` out of the ASP.NET body) and
network/timeout failures (status `0`) into it. Hooks catch it, translate it to a
user-facing Arabic string, and expose it as `error`. Screens render that string.

Branch on `status` / `isNetworkError` / `isUnauthorized`, never on the message
text.

### Registration state

The wizard's draft lives in `RegistrationContext`, not in navigation params.

The draft carries the user's plaintext password, and navigation state is
serializable — anything placed there is reachable by state persistence,
deep-link serialization and crash tooling. The context holds the draft in memory
and clears it when registration completes or the user exits at step 1. Only
`phoneNumber` is passed as a param, because the OTP and success screens display
it.

### Session

Tokens are written by `useOtpVerification` and `useLogin` via `saveTokens`, and
read by `api/client.ts` when a request sets `authenticated: true`.

`@react-native-async-storage/async-storage` v3 removed
`multiGet`/`multiSet`/`multiRemove` in favour of `getMany`/`setMany`/`removeMany`.
The old names are unaliased — they are `undefined`, so calling one throws at
runtime with no compile error at the call site. `tokenStorage` uses the v3
names, guarded by `src/api/__tests__/tokenStorage.test.ts`.

## Navigation

One flat native stack, typed by `RootStackParamList`. Adding a route means
adding it there; a `navigate()` call to an unlisted route is a compile error.

`declare global { namespace ReactNavigation { RootParamList } }` in
`navigation/types.ts` extends that typing to bare `useNavigation()` calls, and
screens receive `ScreenProps<'RouteName'>` for typed `navigation` and `route`.

Login and registration completion use `navigation.reset(...)` rather than
`navigate`, so the auth flow leaves the back stack.

## Design system

`src/theme/` is generated from the published Color Styles and Text Styles of the
Figma file, not inferred from existing code.

- `colors.ts` — `palette` mirrors Figma names (`Primary/G500`, `Neutral/N900`);
  `colors` is the semantic layer components consume.
- `typography.ts` — `Headings/*`, `Body/*`, `Label/*`. Body and Label are
  distinct roles at the same sizes (1.75 vs 1.5 line-height).
- `layout.ts` — spacing, radii, shadows, control sizing, measured from the file.

**Font weight is part of the family name**, never a `fontWeight` prop. Android
ignores `fontWeight` when an explicit PostScript family is set, which is why
`Cairo-Regular` + `fontWeight: '600'` renders Regular there. `Text` has no
`weight` prop by design.

## Testing

Jest with `@react-native/jest-preset`. `jest.setup.js` mocks the native modules
that throw at import (bootsplash, gesture-handler, reanimated, worklets,
bottom-sheet, async-storage), and `transformIgnorePatterns` allowlists the ESM
packages that need Babel.

`__tests__/App.test.tsx` renders the whole navigator, a cheap smoke test for
broken imports and provider wiring. The unit tests cover the two things a bug
would be invisible to the compiler in: the AsyncStorage batch API and the
registration draft lifecycle.
