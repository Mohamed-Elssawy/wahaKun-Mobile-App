# Architecture

Read this before adding a feature. For naming and file style see
[CONVENTIONS.md](./CONVENTIONS.md); for setup and scripts see
[README.md](./README.md).

## Layers

Feature slices on a shared foundation. Imports flow downward only.

```
             app/            root providers + navigator mount
               |
             navigation/     route table, param types, boot routing
               |
             features/       auth, onboarding, reports, map, community,
               |             expert, notifications, user
   +-----------+-----------+--------------+
   |           |           |              |
components/   hooks/    constants/     types/     cross-feature shared code
   |
 theme/       api/      config/                   foundation
```

Four rules keep that honest:

1. `theme/`, `api/` and `config/` import nothing from `features/`.
2. `components/ui/` is presentational: no API calls, no navigation, no feature
   imports. A primitive that needs any of those belongs in
   `features/<name>/components/`.
3. A feature may import another feature's services, types, hooks and shared
   presentational components, never its screens. Onboarding registers through
   `features/auth/services/authService`, community composes its feed from
   `features/map/services/mapService`, and map, community and user all reuse
   `features/reports/errors` and `ReportErrorView`. Code three or more features
   share belongs below `features/` instead, which is why `hooks/useImagePicker`
   and `hooks/useCurrentLocation` sit there.
4. Only `features/*/screens/` and `app/` know about navigation.

Two placements follow from rule 1 and surprise people:

- **`tokenStorage` is in `api/`, not `features/auth/`.** The HTTP client reads the
  access token to sign requests, so in the auth feature it would make `api/` import
  `features/` and close a cycle. `onTokensCleared` exists for the same reason:
  `features/user/role.ts` subscribes to it rather than `api/` reaching into the
  feature.
- **`PickedImage` is in `types/`.** `hooks/useImagePicker` is shared by onboarding
  and reports and sits below `features/`, so it cannot import a type out of one.

Onboarding and auth are separate features because onboarding owns the five-step
wizard while auth owns login and every AuthService binding. That keeps auth usable
by anything needing a session without pulling in the wizard.

## Directory map

```
src/
  api/                 HTTP transport, shared by every feature
    client.ts            fetch wrapper: timeout, auth header, 401 retry
    errors.ts            ApiError (status, isNetworkError, isUnauthorized)
    errorMessages.ts     status and backend code onto Arabic copy
    endpoints.ts         route paths, 1:1 with the .NET controllers
    session.ts           refresh outcomes, expiry, the one JWT decoder
    jwt.ts               the claims the access token carries
    tokenStorage.ts      access and refresh tokens in AsyncStorage
    hubClient.ts         SignalR connection lifecycle, generic over one hub
    mockScenario.ts      the loading/empty/error behaviour every mock shares
  app/App.tsx          GestureHandler > SafeArea > Registration > Navigator
  components/ui/       design-system primitives
  config/
    env.ts               host, ports, base URLs, timeouts, feature flags
    env.local.ts         gitignored per-machine HOST_OVERRIDE
  constants/           countries, governorates, areas
  features/
    auth/                login flows and all AuthService bindings
    onboarding/          the five-step registration wizard
    reports/             file a problem, get a diagnosis, track it
      lifecycle/           the state machine: statuses, nodes, transitions,
                           refusals, the write matrix, selectors, display
      services/
        reportService.ts     the real binding
        reportService.mock.ts in-memory stand-in
        reportQueue.ts       offline delivery queue
        photoStore.ts        durable storage for a queued photo
        reportStore.ts       local mirror and the object-key photo index
        index.ts             picks an implementation, exports reportApi
    map/                 the oasis map: clustering, search, tiers, tiles
    community/           the feed, the comment thread, the SignalR hub binding
    expert/              inbox, case review, scheduling, closure, chats
    notifications/       the shared notifications screen and its time grouping
    user/                profile, settings, role and expert approval
  hooks/               useCountdown, useImagePicker, useCurrentLocation,
                       useAudioPlayer, useAudioRecorder
  navigation/
    RootNavigator.tsx    the single stack
    HomeTabs.tsx         the farmer's bottom tabs
    ExpertTabs.tsx       the expert's bottom tabs
    routeForIdentity.ts  the role routing table, pure
    bootRoute.ts         the boot decision: token, first run, then role
    types.ts             RootStackParamList, the source of routing truth
  theme/               colours, typography, layout, taken from Figma
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
aborting a multipart body the server is still writing leaves a committed report the
client believes failed, which is what produces duplicates.

### Errors

Everything the API layer throws is an `ApiError`. `client.ts` maps non-2xx
responses, lifts `message`, `title` or `error` out of the ASP.NET body, and maps
network and timeout failures to status `0`. Branch on `status`, `isNetworkError` or
`isUnauthorized`, never on the message text.

`features/reports/errors.ts` formalises this for the report flow: it turns any
throw into a `kind` plus Arabic copy, and `ReportErrorView` picks a designed screen
from the kind. `features/expert/services/expertService.ts` does the same for the
expert surface with `classifyExpertError`, which branches on shape (the backend's
`code`, then the status, then whether the body is empty) because the deployment
answers refusals four different ways and three of them carry no readable text.

### Sessions and the 401

A 401 on an authenticated call triggers one refresh and a retry. The outcome of
that refresh is three-way, and the distinction matters:

- `refreshed`: the retry proceeds.
- `refused`: the session is over. Tokens are cleared and the app routes to login.
- `network`: the refresh never reached the server, so the session may still be
  valid. The call raises a network error, which keeps the farmer signed in and
  makes the offline queue back off rather than park waiting for a login.

On this backend a dead refresh token answers `500` with an empty body, so a
response AuthService itself produced counts as `refused`. Only a gateway status
(502, 503, 504) or a body no part of the API would send, such as a proxy's HTML
error page, counts as `network`.

### The wire is copied, not corrected

ASP.NET matches routes exactly, so `endpoints.ts` reproduces the backend's casing
and its typos, and so do the DTO field names in each feature's `types.ts`:
`refershtoken`, `FulltName`, `ClinetUrl`, `ConfemedPassword`, `latiude`,
`longitde`, `Assigend`. They can only be fixed in the backend.

Three quirks are worth knowing before you touch a mapper:

- **Property names arrive camelCase.** Those services call a bare
  `AddControllers()`, so System.Text.Json applies `JsonSerializerDefaults.Web` and
  renames every property. Matching the C# declaration would compile and read
  `undefined` at runtime. Enum values keep their casing, because the server maps
  those with `.ToString()`, and `completed` really is lowercase in the source.
- **Enums arrive as names, and used to arrive as integers.** Mappers accept both
  vocabularies and fall back rather than throwing, because the deployment has
  reverted behaviour before and a mapper that throws takes out a whole list over
  one unrecognised row.
- **Timestamps carry no offset.** `datetime2` through System.Text.Json produces a
  naive string, so `toUtcTimestamp` marks it as the UTC it already is. Reading it
  as local time shifts every card by the device's offset, which near midnight is a
  day.

### Attachments

A photo key is not a URL, and for a long stretch it was not a photo either: the
storage service stored every object at zero length, and the path this client builds
is matched case-sensitively by the ingress in front of it. That produced the
contract the whole app still holds to: **an attachment whose bytes cannot be
fetched is not an attachment.** The resolver answers `undefined` and the screen
draws its designed empty state, rather than being handed a URL that renders a hole.

`STORAGE_SERVES_BYTES` in `reportService.ts` is the single gate on that, and it is
on, so a key now resolves to the storage endpoint. One edit turns every photo in
the app back to its empty state if the bucket regresses, which is the reason the
gate exists rather than each mapper deciding for itself.

The device's own file still wins. `analyze` answers with the object key it stored
the photo under, which is the one moment the key and the local file are both in
hand, so `rememberUploadedPhoto` records the pair and `photoUriForKey` reads the
local file before falling back to storage. The avatar path holds to the same order.

### Filing a report is one network call

`POST /Issue/analyze` uploads the photo, runs the model and enqueues issue creation
as a background job. It returns the diagnosis and no id, and nothing else is sent.
`createIssue` is the local half: it assembles the whole `Report` from the analysis,
mints a local id, and writes it to the mirror.

Two consequences follow. The diagnosis screen is routed to with a `localId` rather
than a report id, because no server id exists yet. And a severity the backend maps
to Low or Unknown produces a diagnosis and no issue at all, so those reports live
only in the mirror. The server's rows and the mirror's rows are therefore disjoint
sets, which is what lets `getMyReports` concatenate them with no matching and still
never show a report twice. If the backend ever starts creating Low-severity issues,
that invariant breaks and the mirror has to go.

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

- **State is module scope,** not a hook, because the queue outlives every screen.
  `subscribeToQueue` feeds `useReportQueue`.
- **The photo is re-encoded, not referenced.** The camera writes to a cache
  directory the OS may evict and the picker returns a path the user can delete, so
  holding the path is not holding the photo. No filesystem module is installed, so
  `react-native-nitro-image` does the encoding and the bytes go to AsyncStorage.
- **A checkpoint sits between analyze and the local write,** so a retry after a
  successful analyze re-uploads nothing and re-runs no model.
- **Retries back off** 5s, 15s, 45s, 2min, 5min, capped at the last step, so a
  queue left open on a dead connection stops burning battery. A network failure
  stops the whole pass; a rejected item is marked failed and the drain steps over
  it.
- **A 401 pauses rather than fails.** The rejected token is remembered, and a
  refresh or a fresh login produces a different one, which is what resumes the
  queue. Auth never has to know the queue exists.
- **Two refusals never retry.** A photo the model will not read and a problem below
  Medium priority answer the same way every time, so the item is marked failed.
- **Triggers** are enqueue, a NetInfo connectivity change, the app returning to the
  foreground, and a timer for the next due item. NetInfo misses a phone
  foregrounded after its radio came back, which is why AppState is a trigger too.

`REPORT_QUEUE_MAX` (5) is a storage budget, since each entry holds a photo.
`enqueueReport` throws `QueueFullError` at the cap so the screen can say so rather
than drop the report.

## The report lifecycle

`features/reports/lifecycle/` is the one model of where a case stands, and it holds
no React and imports nothing from another feature. Everything else reads it.

- `statuses.ts` maps the backend's `IssueStatus` onto the farmer-visible statuses,
  and owns `CONFIDENCE_THRESHOLD`.
- `nodes.ts` places a case on one of six nodes. A status alone cannot do it: three
  statuses span two nodes each, so `LifecycleFacts` carries the four extra booleans
  a screen already holds, and `factsFromWireStatus` builds the conservative version
  for a list row with no detail payload.
- `transitions.ts` is the transition table. `attempt()` returns a result rather
  than throwing, so a screen can branch on a refusal; `refusals.ts` names the
  reasons, and the specific code wins over the generic one.
- `permissions.ts` is the write matrix, split per field so that a farmer cannot be
  granted a write the grouped specification row would have implied.
- `selectors.ts` answers the questions screens ask: which node the public stepper
  shows, which CTA an expert's card carries, whether the farmer may see the model's
  output.

No screen branches on a status string. A screen asks a selector, and the CTA it
renders comes from `expertCtaFor` or the tracker view, never from a local switch.

## The map

MapLibre over Esri World Imagery. Satellite rather than streets because Siwa is
fields, palm groves and canals, and a street basemap of it renders almost empty.
`tiles.ts` is the one place the basemap is decided and carries the licence caveat
plus the constant to swap to.

The map has two states rather than a continuum, so `ZOOMED_IN_SPAN` is the single
line between them: below it one pin per issue, above it counted clusters.

- **Grid clustering, not centroid.** A pin has to hold still while the farmer pans,
  and a centroid moves every frame.
- **Coincident issues merge even when zoomed in.** Two reports about one canal land
  within about 45 metres, which is a single pixel at that zoom, so without merging
  the newest pin draws under the oldest and filing a report looks like it did
  nothing. Tapping a merged pin lists them instead of zooming, because zooming
  could never pull them apart.
- **A cluster takes the worst tier it holds,** so a critical issue never hides
  behind a count that reads as safe.
- **Search is client-side.** The server's search route answers 500 rather than an
  empty list when nothing matches and folds no Arabic spelling, so `search.ts`
  folds the letters a farmer and a keyboard spell differently and matches each word
  separately. The reference printed on the card is searchable too.

## The theme system

`src/theme/` comes from the published Color Styles and Text Styles of the Figma
file, not from what existing code happened to use. Import everything from
`@/theme`, which is the barrel.

- **`colors.ts`.** `palette` mirrors the Figma names (`Primary/G500`,
  `Neutral/N900`). `colors` is the semantic layer components consume; reaching into
  `palette` from a screen is a smell. Every text token clears WCAG AA (4.5:1) on
  both `surface` and `background`. The 500 stops are tuned as fills and fail as
  text, so text has its own stops, and `borderControl` exists because 1.4.11 wants
  3:1 for a border that is the only thing marking a control.
- **`typography.ts`.** `textStyles` maps `Headings/*`, `Body/*` and `Label/*`. Body
  is loose for running text and Label is tight for UI chrome, which is why both
  exist at 14px.
- **`layout.ts`.** A 2pt spacing ramp, radii, shadows and control sizing, measured
  from the file rather than assumed from a 4pt grid. The keys are the values
  themselves, so Figma's `space/10` and the code cannot drift apart.

Never hard-code a colour, font, size, radius or spacing value. ESLint fails the
build on raw hex colours and raw `fontFamily` strings. If a value genuinely is not
in the theme, add it to the theme.

Three rules are enforced in one place each, rather than per screen:

- **Font weight is part of the family name,** never a `fontWeight` prop. Android
  ignores `fontWeight` when an explicit PostScript family is set, so
  `Cairo-Regular` with `fontWeight: '600'` renders Regular there and SemiBold on
  iOS. `Text` has no `weight` prop for that reason.
- **OS font scaling is capped** at `maxFontScale` (1.3) inside `Text`. React Native
  scales text unbounded by default, which overflows every control with a height,
  and controls use `minHeight` rather than `height` for the same reason.
- **Right-to-left is per style,** with `flexDirection: 'row-reverse'` and
  `textAlign: 'right'`, never `I18nManager.forceRTL`. Latin-ish inputs (email,
  phone, password) stay `textAlign: 'left'` inside an otherwise RTL screen.

`npm run tokens:figma` regenerates `tools/figma-p1-plugin/main.js` from
`src/theme`, so the design file's variables are built from the code rather than
kept in step by hand. Edit `tools/figma-p1-plugin/code.js`, never `main.js`.

## Navigation

One flat native stack, typed by `RootStackParamList`. A route has to be listed
there to exist, so `navigate()` to anything else fails to compile. The
`declare global` block in `navigation/types.ts` extends that typing to bare
`useNavigation()` calls, and screens receive `ScreenProps<'RouteName'>`.

`bootRoute.ts` makes the boot decision once: a stored token, then first run, then
the role. `routeForIdentity.ts` is the pure routing table behind it, and the same
decision runs again after every successful login, so a login never navigates
straight to a shell. A session whose role cannot be read is treated as a failed
check rather than guessed at, because the wrong guess shows one role the other's
screens. An unapproved expert lands on a route outside both shells.

`Home` and `ExpertHome` are separate bottom-tab navigators, not one with a flag.
The farmer's report tab is an action tab: it renders no screen, and a `tabPress`
listener cancels the switch and pushes the capture screen onto the root stack.

Login and registration completion use `navigation.reset(...)`, so the auth flow
leaves the back stack.

## State

- **Registration draft.** `RegistrationContext`, not navigation params. The draft
  carries a plaintext password and navigation state is serialisable, so anything in
  it is reachable by state persistence, deep links and crash tooling. Only
  `phoneNumber` travels as a param, because two screens display it.
- **Session.** The login hooks write tokens with `saveTokens` and `api/client.ts`
  reads them. async-storage v3 removed `multiGet`/`multiSet`/`multiRemove` without
  aliasing them, so the old names are `undefined` and throw at runtime with nothing
  failing to compile; `tokenStorage` uses `getMany`/`setMany`/`removeMany`, guarded
  by a test.
- **Phone verification.** Module scope in `features/auth/services/firebaseAuth.ts`,
  because a Firebase `ConfirmationResult` is a live native session that cannot
  travel through navigation params.
- **Report queue.** Module scope, for the same reason. See the queue section.
- **Role.** `features/user/role.ts` caches what the token said so the synchronous
  `resolveRole` has an answer, and drops the cache when the tokens are cleared.
- **Notification preferences.** `preferencesStore.ts`, on the phone. Neither toggle
  has a field on the user or an endpoint, and the UI says so rather than implying
  the setting follows the farmer to a new device.

## Mocks and feature flags

Each feature's `services/index.ts` picks the real service or the mock and exports
it under an interface name. That annotation is load-bearing: change a signature and
whichever implementation drifts stops compiling, so a mock cannot promise data the
backend will not send. Screens and hooks import `reportApi`, `communityApi`,
`expertApi` and the rest, and never reach past them.

`api/mockScenario.ts` gives every mock the same loading, empty and error behaviour,
so `MOCK_SCENARIO` walks all four UI states on a device without a backend.

The flag table lives in [README.md](./README.md#feature-flags). Two flags are read
in exactly one module each so the pure code behind them takes the answer as an
argument and stays testable in both states: `ESCALATE_LOW_CONFIDENCE` by
`features/reports/aiVisibility.ts`, and `USE_MOCK_ROLE` by `features/user/role.ts`.

## Testing

Jest with `@react-native/jest-preset`. `jest.setup.js` mocks the native modules
that throw on import (bootsplash, gesture-handler, reanimated, bottom-sheet,
vision-camera, nitro-image, nitro-sound, geolocation, async-storage, NetInfo,
MapLibre, Firebase auth), stubs `fetch` so no test can reach the network, and
`transformIgnorePatterns` allowlists the ESM packages that need Babel. Suites are
matched by filename, not by folder, so a suite can keep its fixtures beside it.

`__tests__/App.test.tsx` renders the whole navigator, which is a cheap smoke test
for broken imports and provider wiring. The unit tests cover the places a bug would
be invisible to the compiler: the AsyncStorage batch API, the registration draft
lifecycle, Arabic plurals and date formats, confidence normalisation, timestamp and
attachment normalisation, severity tiering, base64 round trips, the Firebase
verification lifecycle, map clustering and tier precedence, Arabic search folding,
haversine distance, the lifecycle tables, the queue's retry policy and persistence,
and the committed values of the feature flags.

`src/__fixtures__/wire/` holds request and response bodies as the server really
sends them, typed `unknown` and cast at the boundary, so a fixture can carry what
the wire sends even where the types would refuse it. The wire suites drive the
mappers from those bodies; `api/__tests__/wireErrors.test.ts` is the only suite
that mocks `fetch` rather than `@/api`, because `parseErrorBody` and the 401 retry
cannot be proven above the `apiClient` seam.
