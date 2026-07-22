# WAHA KUN — Mobile App

React Native client for WAHA KUN (واحة كُن): farmers report water and irrigation
problems, experts review them, and issues are tracked through their lifecycle.
This repo is the mobile front end only; the backend is a separate .NET
microservice solution.

The UI is Arabic-first and right-to-left.

## Requirements

|                   |              |
| ----------------- | ------------ |
| Node              | ≥ 22.11.0    |
| React Native      | 0.86         |
| JDK               | 17 (Android) |
| Xcode + CocoaPods | iOS only     |

## Getting started

```sh
npm install          # also creates src/config/env.local.ts via postinstall
npm start            # Metro
npm run android      # or: npm run ios
```

### Pointing the app at your backend

`src/config/env.ts` defaults to the emulator aliases — `10.0.2.2` on Android,
`localhost` on iOS — so a fresh clone runs with no edits.

On a physical device, set your machine's LAN IP in `src/config/env.local.ts`
(gitignored, created for you on install):

```ts
export const HOST_OVERRIDE: string | null = '192.168.1.9';
```

Find it with `ipconfig` (Windows) or `ipconfig getifaddr en0` (macOS); the phone
and computer must share a Wi-Fi network. Per-service ports live in `PORTS` in
`env.ts` and match the `http` profile of each backend service's
`launchSettings.json`.

## Scripts

| Command                           | Does                                             |
| --------------------------------- | ------------------------------------------------ |
| `npm start`                       | Metro dev server                                 |
| `npm run android` / `ios`         | Build and run                                    |
| `npm run typecheck`               | `tsc --noEmit`                                   |
| `npm run lint` / `lint:fix`       | ESLint                                           |
| `npm run format` / `format:check` | Prettier                                         |
| `npm test`                        | Jest                                             |
| **`npm run verify`**              | **typecheck + lint + test — run before pushing** |

## Project layout

```
src/
  api/          HTTP client, endpoints, ApiError, token storage
  app/           root providers + the App entry
  components/ui/ design-system primitives (Screen, Text, Button, …)
  config/        backend host, ports, base URLs
  constants/     countries, governorates, areas
  features/      auth · onboarding · user (screens, hooks, services)
  hooks/         app-wide hooks
  navigation/    the stack, route param types, placeholders
  theme/         colors, typography, layout — generated from Figma
  types/         shared domain types
```

Imports flow downward only: `features → components/hooks/constants → theme/api/config`.
See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the layering, data flow, and how
the API layer and theme system work, and **[CONVENTIONS.md](./CONVENTIONS.md)**
for house style. The one rule to internalize first:

> Never hard-code a colour, font, size, radius or spacing value. Import it from
> `@/theme`. ESLint fails the build on raw colours and `fontFamily` strings.

## What's implemented

Registration (7-step wizard), phone login, email login, and OTP verification,
wired to `AuthService` and `UserService`.

Six routes exist as themed placeholders because screens already navigate to them
but they aren't built yet (see `src/navigation/PlaceholderScreen.tsx`): `Home`,
`ForgotPassword`, `AccountRecovery`, `EmailOtpVerification`, `TermsOfUse`,
`PrivacyPolicy`. The Figma file has roughly 100 designed screens across Farmer,
Expert and Admin; the feed, map, reporting, issue tracking, notifications and
admin dashboard are still to build.

## Known follow-ups

Left alone deliberately, with the reason:

- **Font bundle.** 56 `.ttf` files are linked natively; 5 are used
  (`Cairo-SemiBold`, `NotoSansArabic-Regular/Medium/SemiBold`, `Lora-Regular`).
  Trimming needs a native re-link and rebuild to verify.
- **Native project naming.** The JS module is `WahaKun`, but the iOS folder is
  still `ios/MyApp` and the Android package is still `com.myapp`. Renaming
  changes the bundle ID and signing, so it's its own migration.
- **Token refresh.** `refreshToken()` exists in `authService` but nothing calls
  it on a 401. `ApiError.isUnauthorized` is there to hang that off.
- **Area data.** `src/constants/areas.ts` is placeholder data covering 5 of 10
  governorates. Only New Valley (الخارجة/الداخلة/الفرافرة/باريس) is real oasis
  data.
- **No resend-OTP endpoint.** The backend only issues OTPs as a side effect of
  `/Auth/Register` and `/Auth/Login`, so the resend button restarts the timer
  without calling anything.
