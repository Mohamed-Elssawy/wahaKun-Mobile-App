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
             features/       auth, onboarding, reports, map, community, user
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
3. A feature may import another feature's services, types, hooks and shared
   presentational components, never its screens. Onboarding uses
   `features/auth/services/authService` to register, community composes its feed
   from `features/map/services/mapService`, and map, community and user all reuse
   `features/reports/errors` and `ReportErrorView`. Code three or more features
   share belongs below `features/` instead: `hooks/useImagePicker` and
   `hooks/useCurrentLocation` sit there for that reason. (`features/reports` still
   holds shared helpers like the error taxonomy and `relativeTime`; moving those
   down is a known follow-up.)
4. Only `features/*/screens/` and `app/` know about navigation.

Two placements follow from rule 1 and surprise people:

- **`tokenStorage` is in `api/`, not `features/auth/`.** The HTTP client reads the
  access token to sign requests. In the auth feature it would make `api/` import
  `features/` and create a cycle.
- **`PickedImage` is in `types/`, not a feature.** `hooks/useImagePicker` is shared
  by onboarding and reports, and it sits below `features/`, so it cannot import a
  type out of one.

Onboarding and auth are separate features because onboarding owns the five-step
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
    env.ts               host, ports, base URLs, timeouts, feature flags
    env.local.ts         gitignored per-machine HOST_OVERRIDE
  constants/           countries, governorates, areas
  features/
    auth/                login flows and all AuthService bindings
      firebaseErrors.ts    Firebase error code to Arabic
      phoneNumber.ts       toE164
      hooks/               useLogin, useOtpVerification, usePasswordReset
      screens/             PhoneLogin, LoginOtp, EmailLogin, ForgotPassword, ResetPassword
      services/            authService.ts, firebaseAuth.ts
    onboarding/          the five-step registration wizard
      context/             RegistrationContext, the in-progress draft
      hooks/               useRegistration
      screens/             Welcome through RegistrationSuccess
    reports/             file a problem, get an AI diagnosis
      base64.ts            encode/decode for the queued photo store
      errors.ts            describeError, the error taxonomy screens branch on
      format.ts            the short report reference shown to the farmer
      relativeTime.ts      Arabic durations
      severity.ts          severity to colour and Arabic label
      status.ts            IssueStatus's seven values onto three display stages
      components/          capture, diagnosis, queue and failure-state pieces
      hooks/               useReportCapture, useReportDiagnosis, useMyReports, ...
      screens/             ReportCapture, ReportAnalyzing, ReportDiagnosis, ...
      services/
        reportService.ts     the real IssueController binding
        reportService.mock.ts in-memory stand-in behind USE_MOCK_REPORTS
        reportQueue.ts       offline delivery queue
        photoStore.ts        durable storage for a queued photo
        reportStore.ts       local mirror standing in for the missing read endpoints
        index.ts             picks an implementation, exports reportApi
    map/                 the oasis map
      clustering.ts        grid clustering and the zoomed-in threshold
      search.ts            Arabic spelling folding and word matching
      tier.ts              priority and status onto the legend's four tiers
      tiles.ts             the basemap style
      components/          pins, clusters, legend, search bar, peek sheet
      hooks/useOasisMap    camera, viewport, selection and fetch
      services/mapService  MapService binding
    community/           the feed and the comment thread
      distance.ts          haversine, for the "0.8 كم" line
      components/          feed card, filter tabs, status pill, comment thread
      hooks/               useCommunityFeed, useIssueComments
      services/            communityService.ts, its mock, and the index that picks
    user/                profile, settings and the header identity
      hooks/               useIdentity, useProfile
      services/            userService.ts, preferencesStore.ts
  hooks/               useCountdown, useImagePicker, useCurrentLocation
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
FormData, aborts after `API_TIMEOUT_MS`, and attaches the bearer token when a call
passes `authenticated: true`. Uploads pass `timeoutMs: UPLOAD_TIMEOUT_MS` instead:
aborting a multipart body the server is still writing produces a committed report
the client believes failed, which is what makes duplicates.

**Errors.** Everything the API layer throws is an `ApiError`. `client.ts` maps
non-2xx responses, pulling `message`, `title` or `error` out of the ASP.NET body,
and maps network and timeout failures to status `0`. Branch on `status`,
`isNetworkError` or `isUnauthorized`. Never branch on the message text: server copy
is not a stable interface and is not always Arabic. The reports feature formalises
this in `features/reports/errors.ts`, which turns any throw into a `kind` plus an
Arabic message, and `ReportErrorView` picks a designed screen from the kind.

**Endpoint paths are verbatim.** ASP.NET matches routes exactly, so `endpoints.ts`
reproduces the backend's casing and its typos. So do the DTO field names in each
feature's `types.ts`: `refershtoken`, `FulltName`, `ClinetUrl`, `ConfemedPassword`,
and `longitde` on `MapResponseDto`. Do not tidy them here. They can only be fixed in
the backend.

**One exception to PascalCase.** The wire shapes in `features/reports/types.ts`,
`features/map/types.ts` and `features/user/types.ts` are camelCase, because those
services' `Program.cs` calls a bare `AddControllers()` and System.Text.Json then
applies `JsonSerializerDefaults.Web`, which renames every property. Matching the C#
declaration would compile and read `undefined` at runtime. Enum values keep their
casing, because the server maps those with `.ToString()`.

**Filing a report is two calls.** `analyze` uploads the photo and runs the model;
`create` takes analyze's whole response back unreshaped and files the issue.
Nothing exists server-side until `create` returns, which is why the queue
checkpoints between them and why `ReportAnalyzing` is routed to with a `localId`
rather than a report id.

**Assembling a `Report`.** `create`'s response carries neither the photo nor the
analysis, so `createIssue` builds the whole `Report` itself. It marks server
timestamps as the UTC they already are (`datetime2` carries no offset, so JS would
read them as local time), rewrites the attachment key onto MediaStorageService
because the server's own URLs 403 and hardcode `127.0.0.1`, folds confidence into
0-1, and maps the integer `IssueStatus` onto a name.

## The offline queue

Intermittent connectivity is the product's defining constraint, so filing a report
never blocks on the network.

```
submit()  ->  photoStore.persistPhoto     re-encode to <=1024px, into AsyncStorage
          ->  reportQueue.enqueueReport   write the index entry, return
          ->  drainQueue()                upload if it can, retry if it cannot
```

`enqueueReport` resolves once the photo is stored, not once it is uploaded. If the
drain finishes in time the screen shows the diagnosis; otherwise it shows the saved
confirmation and the queue keeps working after the screen closes.

- **State is module scope,** not a hook, because the queue has to outlive every
  screen. `subscribeToQueue` feeds `useReportQueue`.
- **The photo is re-encoded, not referenced.** The camera writes to a cache
  directory the OS may evict and the picker returns a path the user can delete, so
  holding the path is not holding the photo. No filesystem module is installed;
  `react-native-nitro-image` does the encoding and the bytes go to AsyncStorage.
- **A checkpoint sits between analyze and create.** A retry after a successful
  analyze re-uploads nothing and re-runs no model.
- **Retries back off** from 5s to 5min, capped, so a queue left open on a dead
  connection stops burning battery. A network failure stops the whole pass; a
  rejected item is marked failed and the drain steps over it.
- **`localId` doubles as the idempotency key,** so a retry after a lost response
  gets the report the server already filed instead of a second one.
- **A 401 pauses rather than fails.** The rejected token is remembered, and a
  refresh or fresh login produces a different one, which is what resumes the queue.
  Auth never has to know the queue exists.
- **Two refusals never retry.** A photo the model will not read and a problem below
  Medium priority answer the same way every time, so the item is marked failed.
- **Triggers** are enqueue, a NetInfo connectivity change, the app returning to the
  foreground, and a timer for the next due item.

`REPORT_QUEUE_MAX` (5) is a storage budget, since each entry holds a photo.
`enqueueReport` throws `QueueFullError` at the cap so the screen can say so rather
than drop the report.

## The map

MapLibre over Esri World Imagery. Satellite rather than streets because Siwa is
fields, palm groves and canals, and a street basemap of it renders almost empty.
`tiles.ts` is the one place the basemap is decided, and it carries the licence
caveat plus the OpenFreeMap constant to swap to.

F-05 has two states rather than a continuum, so `ZOOMED_IN_SPAN` is the single line
between them. Below it the map draws one pin per issue; above it, counted clusters.

- **Grid clustering, not centroid.** A pin has to hold still while the farmer pans,
  and a k-means centroid moves every frame.
- **Coincident issues merge even when zoomed in.** Two reports about the same canal
  land within about 45 metres, which is one pixel at that zoom, so without merging
  the newest pin draws under the oldest and filing a report looks like it did
  nothing. Tapping a merged pin lists them instead of zooming, because zooming
  could never pull them apart.
- **A cluster takes the worst tier it holds,** so a critical issue never hides
  behind a count that reads as safe.
- **Search is client-side.** `SearchForIssueByTitleInMap` answers 500 rather than
  `[]` when nothing matches and folds no Arabic spelling, so `search.ts` folds the
  letters a farmer and a keyboard spell differently and matches every word
  separately. The reference on the card is searchable too.

## The theme system

`src/theme/` comes from the published Color Styles and Text Styles of the Figma
file, not from what existing code happened to use. Import everything from
`@/theme`; `theme/index.ts` is the barrel.

- `colors.ts`. `palette` mirrors the Figma names (`Primary/G500`, `Neutral/N900`).
  `colors` is the semantic layer components consume. Reaching into `palette` from a
  screen is a smell. Every text token clears WCAG AA (4.5:1) on both `surface` and
  `background`; the 500 stops are tuned as fills and fail as text, so text has its
  own stops.
- `typography.ts`. `textStyles` maps `Headings/*`, `Body/*` and `Label/*`. Body is
  loose for running text, Label is tight for UI chrome, which is why both exist at
  14px.
- `layout.ts`. A 2pt spacing ramp, radii, shadows and control sizing, measured from
  the file rather than assumed from a 4pt grid. Keys are the values themselves, so
  Figma's `space/10` and the code cannot drift apart.

Never hard-code a colour, font, size, radius or spacing value. ESLint fails the
build on raw hex colours and raw `fontFamily` strings.

**Font weight is part of the family name**, never a `fontWeight` prop. Android
ignores `fontWeight` when an explicit PostScript family is set, so `Cairo-Regular`
with `fontWeight: '600'` renders Regular there and SemiBold on iOS. `Text` has no
`weight` prop for that reason.

**OS font scaling is capped at `maxFontScale` (1.3)** in `Text`, once, rather than
per screen. RN scales text unbounded by default, which overflows every control with
a height.

`npm run tokens:figma` regenerates `tools/figma-p1-plugin/main.js` from `src/theme`,
so the design file's variables are built from the code rather than kept in step by
hand. Edit `tools/figma-p1-plugin/code.js`, never `main.js`.

## Navigation

One flat native stack, typed by `RootStackParamList`. A route has to be listed
there to exist, so `navigate()` to anything else fails to compile. The
`declare global` block in `navigation/types.ts` extends that typing to bare
`useNavigation()` calls; screens receive `ScreenProps<'RouteName'>`.

Login and registration completion use `navigation.reset(...)`, so the auth flow
leaves the back stack.

`Home` is `HomeTabs`, a bottom-tab navigator typed by `HomeTabParamList`: the feed,
the map, the report action and My Issues. The report tab is an action tab: it
renders no screen, and a `tabPress` listener cancels the switch and pushes
`ReportCapture` onto the root stack.

## State

**Registration draft.** `RegistrationContext`, not navigation params. The draft
carries a plaintext password, and navigation state is serialisable, so anything in
it is reachable by state persistence, deep links and crash tooling. Only
`phoneNumber` travels as a param, because two screens display it.

**Session.** `useOtpVerification` and `useLogin` write tokens with `saveTokens`;
`api/client.ts` reads them. async-storage v3 removed
`multiGet`/`multiSet`/`multiRemove` without aliasing them, so the old names are
`undefined` and throw at runtime with nothing failing to compile. `tokenStorage`
uses `getMany`/`setMany`/`removeMany`, guarded by a test.

**Phone verification.** `features/auth/services/firebaseAuth.ts` holds the in-flight
verification in module scope, because a Firebase `ConfirmationResult` is a live
native session that cannot travel through navigation params.

**Report queue.** Module scope in `services/reportQueue.ts`, for the same reason.
See the offline queue section above.

**Notification preferences.** `features/user/services/preferencesStore.ts`, on the
phone. Neither S-07 toggle has a field on `AppUser` or an endpoint, and the UI says
so rather than implying the setting follows the farmer to a new device.

## Feature flags

Five booleans in `config/env.ts`, each the single switch for one decision:

| Flag                      | Default | Effect                                            |
| ------------------------- | ------- | ------------------------------------------------- |
| `USE_MOCK_REPORTS`        | `false` | serve reports from the in-memory mock             |
| `USE_LOCAL_REPORT_MIRROR` | `true`  | read My Issues and Issue Details from this device |
| `USE_MOCK_COMMUNITY`      | `true`  | serve the feed from seeded posts                  |
| `ENABLE_COMMENT_POSTING`  | `false` | allow posting a comment                           |
| `ESCALATE_LOW_CONFIDENCE` | `false` | send a low-confidence diagnosis to an expert      |

`features/reports/services/index.ts` and `features/community/services/index.ts`
each pick the real service or the mock and export it under an interface name. That
annotation is load-bearing: change a signature and whichever implementation drifts
stops compiling, so a mock cannot promise data the backend will not send. Screens
and hooks import `reportApi` or `communityApi` and never reach past them.

The mocks stay useful for working on the diagnosis and feed screens with no backend
running, and the report mock is the only place the duplicate-upload path can be
exercised, because it honours the idempotency key and the real server does not yet.

Three of the five are open backend gaps rather than product decisions. The feature
tables in this doc and in the README note which, and why.

## Testing

Jest with `@react-native/jest-preset`. `jest.setup.js` mocks the native modules that
throw on import (bootsplash, gesture-handler, reanimated, bottom-sheet,
vision-camera, nitro-image, geolocation, async-storage, NetInfo, MapLibre, Firebase
auth), stubs `fetch` so no test can reach the network, and
`transformIgnorePatterns` allowlists the ESM packages that need Babel.

`__tests__/App.test.tsx` renders the whole navigator, which is a cheap smoke test
for broken imports and provider wiring. The unit tests cover the places where a bug
would be invisible to the compiler: the AsyncStorage batch API, the registration
draft lifecycle, Arabic plurals, confidence normalisation, timestamp and attachment
normalisation, severity tiering, base64 round trips, the Firebase verification
lifecycle, map clustering and tier precedence, Arabic search folding, haversine
distance, and the queue's retry policy, persistence and ordering.
