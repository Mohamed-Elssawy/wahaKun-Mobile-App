# WAHA KUN mobile app

React Native client for WAHA KUN (واحة كُن). A farmer photographs a water or
irrigation problem, an AI model diagnoses it, and an expert reviews what the model
cannot settle. This repository is the mobile front end only; the backend is a
separate .NET microservice solution.

The UI is Arabic-first and right to left.

## Requirements

| Tool                | Version                   |
| ------------------- | ------------------------- |
| Node                | 22.11.0 or newer          |
| React Native        | 0.86 (bare CLI, not Expo) |
| JDK                 | 17, for Android           |
| Xcode and CocoaPods | iOS only                  |

## Setup

```sh
npm install          # postinstall also writes src/config/env.local.ts
npm start            # Metro
npm run android      # or: npm run ios
```

Two things are deliberately not in the repository and you have to supply them.

**`android/app/google-services.json`.** The Android build fails without it. In the
Firebase console, register an Android app with package name `com.myapp`, add your
debug SHA-1, download the file into `android/app/`, and enable the Phone sign-in
provider. Add a number under Phone > Phone numbers for testing so development needs
no real SMS, and allow your region under Authentication > Settings > SMS region
policy. `google-services.example.json` shows the expected shape. Never commit the
real one.

**Your backend address, if you are on a physical device.** `config/env.ts` defaults
to the emulator aliases (`10.0.2.2` on Android, `localhost` on iOS), so a fresh
clone runs with no edits. For a real device, put your machine's LAN IP in the
gitignored `src/config/env.local.ts` that `npm install` created:

```ts
export const HOST_OVERRIDE: string | null = '192.168.1.9';
```

Find it with `ipconfig` on Windows or `ipconfig getifaddr en0` on macOS. The phone
and the computer have to be on the same Wi-Fi. Per-service ports live in `PORTS` in
`env.ts` and match the `http` profile of each backend service's
`launchSettings.json`.

Adding a native module means a full rebuild; a Metro reload will not pick it up.

Starting the backend is a separate job. The scripts that bring up the .NET
services, the vision service, MinIO and Redis are kept out of this repository
because they carry absolute paths to one machine's sibling checkouts. Ask for them
if you need the whole stack locally.

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

## Project layout

```
src/
  api/           HTTP client, endpoints, ApiError, token storage, SignalR
  app/           root providers and the App entry
  components/ui/ design-system primitives (Screen, Text, Button, ...)
  config/        backend host, ports, base URLs, feature flags
  constants/     countries, governorates, areas
  features/      auth, onboarding, reports, map, community, expert, user,
                 notifications
  hooks/         app-wide hooks (image picker, location, audio, countdown)
  navigation/    the stack, route param types, boot routing
  theme/         colours, typography, layout, taken from Figma
  types/         shared domain types
```

Imports flow downward only: `features/` reaches `components/`, `hooks/` and
`constants/`, then `theme/`, `api/` and `config/`. Nothing below `features/` may
import from it. [ARCHITECTURE.md](./ARCHITECTURE.md) has the full map and the
reasoning behind it.

## Conventions

[CONVENTIONS.md](./CONVENTIONS.md) is the full house style. The five that come up
in review:

1. **Never hard-code a colour, font, size, radius or spacing value.** Import it
   from `@/theme`. ESLint fails the build on raw hex and raw `fontFamily`.
2. **Screens compose, components present, hooks do the work.** A screen holds form
   state and decides where to navigate. It does not call `apiClient` or build a
   request body.
3. **Backend field names are copied verbatim, typos included.** `refershtoken`,
   `FulltName`, `latiude` and `longitde` are not mistakes here. Correcting them
   breaks the request.
4. **Branch on `ApiError.status`, `isNetworkError` or `isUnauthorized`,** never on
   the message text. Server copy is not an interface and is not always Arabic.
5. **Comments say why, not what, and every one fits on a single line.** If it needs
   a second line, it belongs in ARCHITECTURE.md.

## Feature flags

Twelve booleans in `src/config/env.ts`, plus `LOG_API_ERRORS` (tied to `__DEV__`).
Each flag is the only place its decision is made.

| Flag                      | Default   | Effect                                                                     |
| ------------------------- | --------- | -------------------------------------------------------------------------- |
| `DEMO_MODE`               | `false`   | master switch; ORs into every flag below, forcing all of them onto mocks   |
| `USE_MOCK_REPORTS`        | `false`   | serve reports from the in-memory mock instead of ReportService             |
| `USE_LOCAL_REPORT_MIRROR` | `true`    | hold the reports the backend declines to create, and the local photo index |
| `USE_MOCK_TRACKER`        | `false`   | serve the report tracker from the mock instead of the real tracking route  |
| `USE_MOCK_COMMUNITY`      | `true`    | serve the feed from seeded posts                                           |
| `USE_MOCK_USER`           | `false`   | a signed-in farmer with no AuthService call                                |
| `ENABLE_COMMENT_POSTING`  | `false`   | allow posting a comment                                                    |
| `ESCALATE_LOW_CONFIDENCE` | `true`    | hide a sub-80% diagnosis from the farmer and escalate it instead           |
| `USE_MOCK_ROLE`           | `false`   | off: the role comes from the access token's claim                          |
| `USE_MOCK_EXPERT_QUEUE`   | `false`   | serve the expert inbox and review from the mock                            |
| `USE_MOCK_EXPERT_CHATS`   | `true`    | no chat endpoint exists yet                                                |
| `USE_MOCK_NOTIFICATIONS`  | `true`    | NotificationService has no route this app has ever found                   |
| `LOG_API_ERRORS`          | `__DEV__` | log every `ApiError` in a dev build                                        |

`USE_MOCK_COMMUNITY`, `USE_MOCK_EXPERT_CHATS` and `USE_MOCK_NOTIFICATIONS` are open
backend gaps rather than product decisions. `ESCALATE_LOW_CONFIDENCE` is the one
that is purely a product stance.

`MOCK_ROLE`, `MOCK_EXPERT_APPROVAL` and `MOCK_SCENARIO` are settings rather than
switches: they pick which identity and which UI state the mocks serve.

## Backend contract

The backend repository is the source of truth for every contract. Read the DTO and
the controller before changing a request shape here, because several field names
and route spellings are reproduced verbatim and cannot be corrected on this side.

Section references in the code (`§4.1`, `§8.2`, `F-06`, `E-01`, `T4`, `X-05`) point
at the system specification and the Figma frame set, which are kept outside this
repository. Ask if you need a copy.

## Known gaps

- **Chat, notifications and the community feed run on mocks.** No endpoint exists
  for a chat thread or a notification, and CommunityService has no feed route, so
  the feed is composed from seeded posts rather than served.
- **Storage is trusted to serve bytes again.** `STORAGE_SERVES_BYTES` is on, so an
  object key resolves to a storage URL and the screens draw it. It was off while
  every stored object came back zero length; if that returns, turning it off puts
  every photo back to its designed empty state in one edit.
- **Voice and text reports cannot be submitted on their own.** Recording works, but
  `/Issue/analyze` requires a photo server-side, so the send control says so up
  front instead of failing at the end.
- **`emitIssueChange` is never called.** `subscribeToIssueChanges` is wired into the
  map so an open map refetches when a report is filed, but nothing emits the event,
  so that refresh never fires.
- **Area data is placeholder.** `src/constants/areas.ts` covers 5 of 10
  governorates and only the New Valley entries are real.
- **Native project naming.** The JS module is `WahaKun`, the iOS folder is still
  `ios/MyApp` and the Android package is still `com.myapp`. Renaming changes the
  bundle ID and the signing config, so it is its own migration.
