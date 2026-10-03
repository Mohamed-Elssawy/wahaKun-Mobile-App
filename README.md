# WAHA KUN mobile app

React Native client for WAHA KUN (واحة كُن). Farmers photograph a water or
irrigation problem, an AI model diagnoses it, and experts review what it cannot
settle. This repo is the mobile front end; the backend is a separate .NET
microservice solution.

The UI is Arabic-first and right to left.

## Requirements

|                     |                           |
| ------------------- | ------------------------- |
| Node                | 22.11.0 or newer          |
| React Native        | 0.86 (bare CLI, not Expo) |
| JDK                 | 17, for Android           |
| Xcode and CocoaPods | iOS only                  |

## Setup

```sh
npm install          # postinstall also creates src/config/env.local.ts
npm start            # Metro
npm run android      # or: npm run ios
```

Two things are not in the repo and you have to supply them.

**1. `android/app/google-services.json`.** The Android build fails without it. In
the Firebase console: register an Android app with package name `com.myapp`, add
your debug SHA-1, download the file into `android/app/`, and enable the Phone
sign-in provider. Add a number under Phone > Phone numbers for testing so
development needs no real SMS, and allow your region under Authentication >
Settings > SMS region policy. `google-services.example.json` shows the expected
shape. Never commit the real one.

**2. Your backend address, if you are on a physical device.** `config/env.ts`
defaults to the emulator aliases (`10.0.2.2` on Android, `localhost` on iOS), so a
fresh clone runs with no edits. For a real device, put your machine's LAN IP in the
gitignored `src/config/env.local.ts` that `npm install` created:

```ts
export const HOST_OVERRIDE: string | null = '192.168.1.9';
```

Find it with `ipconfig` on Windows or `ipconfig getifaddr en0` on macOS. The phone
and the computer have to be on the same Wi-Fi. Per-service ports live in `PORTS` in
`env.ts` and match the `http` profile of each backend service's
`launchSettings.json`.

Adding a native module means a full rebuild. A Metro reload will not pick it up.

## Scripts

| Command                           | Does                                                  |
| --------------------------------- | ----------------------------------------------------- |
| `npm start`                       | Metro dev server                                      |
| `npm run android` / `ios`         | build and run                                         |
| `npm run typecheck`               | `tsc --noEmit`                                        |
| `npm run lint` / `lint:fix`       | ESLint                                                |
| `npm run format` / `format:check` | Prettier                                              |
| `npm test`                        | Jest                                                  |
| `npm run verify`                  | typecheck, lint and test. Run this before you push.   |
| `npm run tokens:figma`            | regenerate the Figma variable plugin from `src/theme` |

Starting the backend is a separate job. The PowerShell scripts that bring up the
.NET services, the vision service, MinIO and Redis are kept out of the repo,
because they carry absolute paths to one machine's sibling checkouts. Ask for them
if you need to run the whole stack locally.

## Layout

```
src/
  api/           HTTP client, endpoints, ApiError, token storage
  app/           root providers and the App entry
  components/ui/ design-system primitives (Screen, Text, Button, ...)
  config/        backend host, ports, base URLs, feature flags
  constants/     countries, governorates, areas
  features/      auth, onboarding, reports, map, community, user
  hooks/         app-wide hooks
  navigation/    the stack, route param types, placeholders
  theme/         colors, typography, layout, taken from Figma
  types/         shared domain types
```

Imports flow downward only: `features` to `components`, `hooks` and `constants`,
then to `theme`, `api` and `config`. Nothing below `features/` may import from it.
[ARCHITECTURE.md](./ARCHITECTURE.md) has the full map.

## Conventions

Full detail is in [CONVENTIONS.md](./CONVENTIONS.md). The five that come up in
review:

1. **Never hard-code a colour, font, size, radius or spacing value.** Import it
   from `@/theme`. ESLint fails the build on raw hex and raw `fontFamily`.
2. **Screens compose, components present, hooks do the work.** A screen holds form
   state and decides where to navigate. It does not call `apiClient` or build a
   request body.
3. **Backend field names are copied verbatim, typos included.** `refershtoken`,
   `FulltName` and `longitde` are not mistakes in this repo. Fixing them here
   breaks the request.
4. **Branch on `ApiError.status`, `isNetworkError` or `isUnauthorized`.** Never on
   the message text.
5. **Comments say why, not what, and each one fits on a single line.** If it needs
   a paragraph, it belongs in a doc.

## Feature flags

Four booleans in `src/config/env.ts`. Each is the only place its decision is made.

| Flag                      | Default | Meaning                                                               |
| ------------------------- | ------- | --------------------------------------------------------------------- |
| `USE_MOCK_REPORTS`        | `false` | serve reports from the in-memory mock instead of ReportService        |
| `USE_LOCAL_REPORT_MIRROR` | `true`  | read My Issues and Issue Details from this device's own mirror        |
| `ENABLE_COMMENT_POSTING`  | `false` | allow posting a comment                                               |
| `ESCALATE_LOW_CONFIDENCE` | `false` | escalate a low-confidence diagnosis rather than showing it            |

The two that default on or block a feature are all waiting on the backend, not
on product decisions. `USE_LOCAL_REPORT_MIRROR` is on because IssueController
exposes no `GetMyIssues` or `GetIssueById`. `ENABLE_COMMENT_POSTING` is off
because posting needs a moderation service on `:8000` that is not in the backend
repo.

## What is built

- **Registration**, a five-step wizard, plus phone login and email login against
  AuthService and UserService.
- **Reports**, end to end: capture from camera or gallery, an offline delivery
  queue, AI analysis, the diagnosis screen, My Issues with filters, and issue
  details. Designed states exist for offline, unauthorized, upload failure and a
  photo the model cannot read.
- **The oasis map**, on MapLibre over satellite imagery: one pin per issue when
  zoomed in, counted clusters when zoomed out, a peek sheet per pin, Arabic search
  that folds spelling, and a legend.
- **The comment thread on issue details**, against the real CommunityService endpoint.
- **Profile and settings.**

The community feed tab is a placeholder (`المجتمع`). It was built against a mock
feed; CommunityService has no feed endpoint and MapResponseDto carries no
reporter or counts, so there is nothing real to build it against yet. See
"Known follow-ups".

Filing a report never blocks on the network. The photo is re-encoded into
AsyncStorage first, then uploaded when a connection allows, so composing a report
always succeeds. See the offline queue section of ARCHITECTURE.md.

Phone verification goes through Firebase and there is no alternative: AuthService
removed its own OTP endpoint. Registration posts the Firebase ID token to
`/Auth/Register` with the wizard's fields and gets tokens back; login posts the
token alone to `/Auth/firebase-login`.

Three routes are themed placeholders because screens already navigate to them:
`TermsOfUse`, `PrivacyPolicy` and `ConnectToExpert`. The Figma file has roughly 100
designed screens across Farmer, Expert and Admin. Notifications, the expert screens
and the admin dashboard are still to build.

## Known follow-ups

Left alone deliberately, with the reason:

- **Token refresh.** `refreshToken()` exists in `authService` and nothing calls it
  on a 401. `ApiError.isUnauthorized` is there to hang that off.
- **A typed 422 for refused photos.** The vision service answers 200 for a photo it
  will not diagnose; ReportService turns that into an untyped 500, so
  `features/reports/errors.ts` has to sniff the body. It only works on a
  Development build. Tracked as a TODO in that file.
- **My Issues reads a local mirror.** IssueController's three read endpoints are
  commented out server-side. `features/reports/services/reportStore.ts` stands in
  and should be deleted when they come back.
- **The My Issues card is missing its tracker.** F-07 draws a progress step, a
  progress bar and a contextual box on an active card, and a resolved card names
  the team that fixed it. None of that has an endpoint yet.
- **Voice capture is a text box.** `CreateReportRequest` has no audio field and no
  recording library is installed, so the record control says so rather than
  failing silently. The typed description is real and uploads with the photo.
- **The community feed is a placeholder.** It was built against a seeded mock
  (`communityService.mock.ts`, now removed) rather than CommunityService, which
  has no feed endpoint. Rebuild it for real once that endpoint exists.
- **The community hub is not wired.** CommunityService exposes a SignalR hub for
  live counters. Nothing connects to it.
- **Font bundle.** 56 `.ttf` files are linked natively and 5 are used. Trimming
  needs a native re-link and a rebuild to verify.
- **Native project naming.** The JS module is `WahaKun`, the iOS folder is still
  `ios/MyApp` and the Android package is still `com.myapp`. Renaming changes the
  bundle ID and the signing config, so it is its own migration.
- **Area data.** `src/constants/areas.ts` is placeholder data covering 5 of 10
  governorates. Only the New Valley entries are real.
- **Resend is not wired.** The button restarts the timer without asking for a new
  code. Firebase makes a real resend a one-liner, since `sendVerificationCode`
  already replaces the verification in flight.

## Backend

Source of truth for every contract: `youssefzienhoum/Graduation-Project`. Read the
DTOs and the controller before changing a request shape here, because several field
names and route spellings are reproduced verbatim and cannot be corrected on this
side. The open backend gaps are noted inline: see "Known follow-ups" above and the
feature-flag notes.
