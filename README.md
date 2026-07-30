# WAHA KUN mobile app

React Native client for WAHA KUN (واحة كُن). Farmers report water and irrigation
problems, an AI model diagnoses them from a photo, and experts review what it
cannot settle. This repo is the mobile front end. The backend is a separate .NET
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
npm install          # also creates src/config/env.local.ts via postinstall
npm start            # Metro
npm run android      # or: npm run ios
```

Two things are not in the repo and you have to supply them.

**1. `android/app/google-services.json`.** The Android build fails without it,
saying the file is missing. In the Firebase console: register an Android app with
package name `com.myapp`, add your debug SHA-1 to it, download the file into
`android/app/`, and enable the Phone sign-in provider. Add a number under Phone >
Phone numbers for testing so development needs no real SMS, and allow your region
under Authentication > Settings > SMS region policy.
`google-services.example.json` shows the expected shape. Never commit the real one.

**2. Your backend address, if you are on a physical device.** `config/env.ts`
defaults to the emulator aliases (`10.0.2.2` on Android, `localhost` on iOS), so a
fresh clone runs with no edits. For a real device, put your machine's LAN IP in
`src/config/env.local.ts`, which `npm install` created for you and which is
gitignored:

```ts
export const HOST_OVERRIDE: string | null = '192.168.1.9';
```

Find it with `ipconfig` on Windows or `ipconfig getifaddr en0` on macOS. The phone
and the computer have to be on the same Wi-Fi. Per-service ports live in `PORTS`
in `env.ts` and match the `http` profile of each backend service's
`launchSettings.json`.

Adding a native module means a full rebuild. Metro reload will not pick it up.

## Scripts

| Command                           | Does                                                |
| --------------------------------- | --------------------------------------------------- |
| `npm start`                       | Metro dev server                                    |
| `npm run android` / `ios`         | build and run                                       |
| `npm run typecheck`               | `tsc --noEmit`                                      |
| `npm run lint` / `lint:fix`       | ESLint                                              |
| `npm run format` / `format:check` | Prettier                                            |
| `npm test`                        | Jest                                                |
| `npm run verify`                  | typecheck, lint and test. Run this before you push. |

## Layout

```
src/
  api/           HTTP client, endpoints, ApiError, token storage
  app/           root providers and the App entry
  components/ui/ design-system primitives (Screen, Text, Button, ...)
  config/        backend host, ports, base URLs, feature flags
  constants/     countries, governorates, areas
  features/      auth, onboarding, reports, user
  hooks/         app-wide hooks
  navigation/    the stack, route param types, placeholders
  theme/         colors, typography, layout, taken from Figma
  types/         shared domain types
```

Imports flow downward only: `features` to `components`, `hooks` and `constants`,
then to `theme`, `api` and `config`. Nothing below `features/` may import from it.

## Conventions

Full detail is in [CONVENTIONS.md](./CONVENTIONS.md) and
[ARCHITECTURE.md](./ARCHITECTURE.md). The five that come up in review:

1. **Never hard-code a colour, font, size, radius or spacing value.** Import it
   from `@/theme`. ESLint fails the build on raw hex and raw `fontFamily`.
2. **Screens compose, components present, hooks do the work.** A screen holds form
   state and decides where to navigate. It does not call `apiClient` or build a
   request body.
3. **Backend field names are copied verbatim, typos included.** `refershtoken` and
   `FulltName` are not mistakes in this repo. Fixing them here breaks the request.
4. **Branch on `ApiError.status`, `isNetworkError` or `isUnauthorized`.** Never on
   the message text.
5. **Comments say why, not what, and each one fits on a single line.** If it needs
   a paragraph, it belongs in a doc.

## Feature flags

Two booleans in `src/config/env.ts`. Each is the only place its decision is made.

| Flag                      | Default | Meaning                                                                             |
| ------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `USE_MOCK_REPORTS`        | `true`  | reports come from an in-memory mock, because no ReportService instance is reachable |
| `ESCALATE_LOW_CONFIDENCE` | `false` | a low-confidence diagnosis is shown to the farmer rather than escalated             |

## What is built

Registration (seven-step wizard), phone login and email login, against AuthService
and UserService. The report flow is complete: capture from
camera or gallery, upload, AI analysis, the diagnosis screen, My Issues with
filters, and issue details, with designed failure states for offline,
unauthorized and upload failure.

Phone verification goes through Firebase, and there is no longer any alternative:
AuthService removed its own OTP endpoint. Registration posts the Firebase ID token
to `/Auth/Register` with the wizard's fields and gets tokens back; login posts the
token alone to `/Auth/firebase-login`.

Six routes are themed placeholders because screens already navigate to them:
`ForgotPassword`, `AccountRecovery`, `EmailOtpVerification`, `TermsOfUse`,
`PrivacyPolicy`, `ConnectToExpert`. The Figma file has roughly 100 designed
screens across Farmer, Expert and Admin. The feed, map, notifications and admin
dashboard are still to build.

## Known follow-ups

Left alone deliberately, with the reason:

- **Token refresh.** `refreshToken()` exists in `authService` and nothing calls it
  on a 401. `ApiError.isUnauthorized` is there to hang that off.
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
- **`deleteReport` is unused.** The F-04 frame has no delete affordance, so the
  binding exists and no screen calls it.

## Backend

Source of truth for every contract: `youssefzienhoum/Graduation-Project`. Read the
DTOs and the controller before changing a request shape here, because several
field names and route spellings are reproduced verbatim and cannot be corrected
on this side.
