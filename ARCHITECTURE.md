# Architecture

Read this before adding a feature. For naming and file style, see
[CONVENTIONS.md](./CONVENTIONS.md).

## Layers

Feature slices on a shared foundation. Imports flow downward only.

```
             app/            root providers + navigator mount
               |
             navigation/     route table, param types, placeholders
               |
             features/       auth, onboarding, reports, user
               |             (screens, feature components, hooks, services)
               |
   +-----------+-----------+--------------+
   |           |           |              |
components/   hooks/    constants/     types/     cross-feature shared code
   |
 theme/       api/      config/                   foundation
```

Four rules keep that honest:

1. `theme/`, `api/` and `config/` import nothing from `features/`.
2. `components/ui/` is presentational. No API calls, no navigation, no feature imports.
3. A feature may import another feature's services and types, never its screens.
   Onboarding uses `features/auth/services/authService` to register.
4. Only `features/*/screens/` and `app/` know about navigation.

Two placements follow from rule 1 and surprise people:

- **`tokenStorage` is in `api/`, not `features/auth/`.** The HTTP client reads the
  access token to sign requests. In the auth feature it would make `api/` import
  `features/` and create a cycle.
- **`PickedImage` is in `types/`, not a feature.** `hooks/useImagePicker` is shared
  by onboarding and reports, and it sits below `features/`, so it cannot import a
  type out of one.

Onboarding and auth are separate features because onboarding owns the seven-step
wizard and auth owns login plus every AuthService binding. That keeps auth usable
by anything that needs a session without pulling in the wizard.

## Directory map

```
src/
  api/                 HTTP transport, shared by every feature
    client.ts            fetch wrapper: timeout, auth header, error mapping
    errors.ts            ApiError (status, isNetworkError, isUnauthorized)
    endpoints.ts         route paths, 1:1 with the .NET controllers
    tokenStorage.ts      access and refresh tokens in AsyncStorage
  app/App.tsx          GestureHandler > SafeArea > Registration > Navigator
  components/ui/       design-system primitives
  config/
    env.ts               host, ports, base URLs, timeout, feature flags
    env.local.ts         gitignored per-machine HOST_OVERRIDE
  constants/           countries, governorates, areas
  features/
    auth/                login flows and all AuthService bindings
      firebaseErrors.ts    Firebase error code to Arabic
      phoneNumber.ts       toE164
      hooks/               useLogin, useOtpVerification
      screens/             PhoneLogin, LoginOtp, EmailLogin
      services/            authService.ts, firebaseAuth.ts
    onboarding/          the seven-step registration wizard
      context/             RegistrationContext, the in-progress draft
      hooks/               useRegistration
      screens/             Welcome through RegistrationSuccess
    reports/             file a problem, get an AI diagnosis
      errors.ts            describeError, the error taxonomy screens branch on
      severity.ts          severity to colour and Arabic label
      relativeTime.ts      Arabic durations
      components/          capture, diagnosis and failure-state pieces
      hooks/               useReportCapture, useReportAnalysis, useMyReports, ...
      screens/             ReportCapture, ReportAnalyzing, ReportDiagnosis, ...
      services/            reportService.ts, reportService.mock.ts, index.ts
    user/                UserService bindings
  hooks/               useCountdown, useImagePicker
  navigation/
    RootNavigator.tsx    the single stack
    HomeTabs.tsx         the four bottom tabs behind Home
    types.ts             RootStackParamList, the source of routing truth
  theme/               colors, typography, layout, taken from Figma
  types/               shared domain types (location, image)
```

## The API layer

Every request goes through one path:

```
Screen  ->  feature hook  ->  feature service  ->  api/client
(render,    (loading,         (endpoint and       (headers, timeout,
 form       error,            body shape)          ApiError mapping)
 state)     orchestration)
```

Screens never call `apiClient` and never build a request body. `useRegistration`
is the clearest case: it owns the FormData build and the farmer/expert branch, so
`PhoneScreen` only decides where to navigate from the outcome it gets back.

`apiClient` takes a base URL and a path, sets JSON headers unless the body is
FormData, aborts after `API_TIMEOUT_MS`, and attaches the bearer token when a
call passes `authenticated: true`.

**Errors.** Everything the API layer throws is an `ApiError`. `client.ts` maps
non-2xx responses, pulling `message`, `title` or `error` out of the ASP.NET body,
and maps network and timeout failures to status `0`. Branch on `status`,
`isNetworkError` or `isUnauthorized`. Never branch on the message text: server
copy is not a stable interface and is not always Arabic. The reports feature
formalises this in `features/reports/errors.ts`, which turns any throw into a
`kind` plus an Arabic message, and `ReportErrorView` picks a designed screen from
the kind.

**Endpoint paths are verbatim.** ASP.NET matches routes exactly, so
`endpoints.ts` reproduces the backend's casing and its typos. So do the DTO field
names in each feature's `types.ts`: `refershtoken`, `FulltName`, `ClinetUrl`,
`ConfemedPassword`. Do not tidy them here. They can only be fixed in the backend.

**One exception to PascalCase.** The wire shapes in
`features/reports/types.ts` are camelCase, because ReportService's `Program.cs`
calls a bare `AddControllers()` and System.Text.Json then applies
`JsonSerializerDefaults.Web`, which renames every property. Matching the C#
declaration would compile and read `undefined` at runtime. Enum values keep their
casing, because the server maps those with `.ToString()`.

## The theme system

`src/theme/` comes from the published Color Styles and Text Styles of the Figma
file, not from what existing code happened to use.

- `colors.ts`. `palette` mirrors the Figma names (`Primary/G500`, `Neutral/N900`).
  `colors` is the semantic layer components consume. Reaching into `palette` from
  a screen is a smell.
- `typography.ts`. `textStyles` maps `Headings/*`, `Body/*` and `Label/*`. Body is
  loose for running text, Label is tight for UI chrome, which is why both exist at
  14px.
- `layout.ts`. Spacing, radii, shadows and control sizing, measured from the file
  rather than assumed from a 4pt grid.

Never hard-code a colour, font, size, radius or spacing value. Import it from
`@/theme`. ESLint fails the build on raw hex colours and raw `fontFamily` strings.

**Font weight is part of the family name**, never a `fontWeight` prop. Android
ignores `fontWeight` when an explicit PostScript family is set, so
`Cairo-Regular` with `fontWeight: '600'` renders Regular there and SemiBold on
iOS. `Text` has no `weight` prop for that reason.

## Navigation

One flat native stack, typed by `RootStackParamList`. A route has to be listed
there to exist, so `navigate()` to anything else fails to compile. The
`declare global` block in `navigation/types.ts` extends that typing to bare
`useNavigation()` calls; screens receive `ScreenProps<'RouteName'>`.

Login and registration completion use `navigation.reset(...)`, so the auth flow
leaves the back stack.

`Home` is `HomeTabs`, a bottom-tab navigator typed by `HomeTabParamList`. The
report tab is an action tab: it renders no screen, and a `tabPress` listener
cancels the switch and pushes `ReportCapture` onto the root stack.

## State

**Registration draft.** `RegistrationContext`, not navigation params. The draft
carries a plaintext password, and navigation state is serialisable, so anything
in it is reachable by state persistence, deep links and crash tooling. Only
`phoneNumber` travels as a param, because two screens display it.

**Session.** `useOtpVerification` and `useLogin` write tokens with `saveTokens`;
`api/client.ts` reads them. async-storage v3 removed
`multiGet`/`multiSet`/`multiRemove` without aliasing them, so the old names are
`undefined` and throw at runtime with nothing failing to compile.
`tokenStorage` uses `getMany`/`setMany`/`removeMany`, guarded by a test.

**Phone verification.** `features/auth/services/firebaseAuth.ts` holds the
in-flight verification in module scope, because a Firebase `ConfirmationResult`
is a live native session that cannot travel through navigation params.

## Feature flags

Two booleans in `config/env.ts`, each the single switch for one decision:

| Flag                      | Effect                                       |
| ------------------------- | -------------------------------------------- |
| `USE_MOCK_REPORTS`        | serve reports from the in-memory mock        |
| `ESCALATE_LOW_CONFIDENCE` | send a low-confidence diagnosis to an expert |

`features/reports/services/index.ts` picks the real service or the mock and
exports it as `ReportApi`. That annotation is load-bearing: change a signature
and whichever implementation drifts stops compiling, so the mock cannot promise
data the backend will not send. Screens and hooks import `reportApi` and never
reach past it.

The mock exists because ReportService cannot back the feature yet. It returns a
report id and maps the AI analysis, but `AnalyzeReportAsync` sets
`Status = Analyzed` unconditionally and never assigns `Escalated`.

## Testing

Jest with `@react-native/jest-preset`. `jest.setup.js` mocks the native modules
that throw on import (bootsplash, gesture-handler, reanimated, bottom-sheet,
vision-camera, geolocation, async-storage, Firebase auth), and
`transformIgnorePatterns` allowlists the ESM packages that need Babel.

`__tests__/App.test.tsx` renders the whole navigator, which is a cheap smoke test
for broken imports and provider wiring. The unit tests cover the places where a
bug would be invisible to the compiler: the AsyncStorage batch API, the
registration draft lifecycle, Arabic plurals, confidence normalisation, the
report mock's confidence gate, and the Firebase verification lifecycle.
