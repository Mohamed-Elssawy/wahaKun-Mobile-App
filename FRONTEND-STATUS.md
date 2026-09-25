# Frontend status — onboarding and login redesign

Branch `feature/onboarding-login-redesign`. Committed, not merged.

The new Figma (`📱 Hi-Fi Screens — Farmer 2`) is applied to the whole onboarding
and login flow, forgot-password is wired end to end, and the two steps the
redesign drops from signup became profile edits instead of dead code.

Figma source: the **REST API**, full per-node values. `.figma.local` holds two
tokens — `FIGMA_TOKEN` returns `403 Token expired` and can be deleted;
`FIGMA_TOKEN_2` works. Screenshots were used only to settle ambiguities, and
they agreed with the API everywhere except the country-code chevron (below).

---

## What changed

**The wizard is five steps, not seven.** Name → role → email/password → phone →
OTP. Role moved from fourth to second. The step label is now `الخطوة ٢ من ٥`
rather than an Arabic ordinal, and back is a chevron rather than the word
`العودة`.

**Profile picture and location left signup.** Both are now profile edits, which
is where S-07 puts them:

- `features/user/screens/EditRegionScreen` — route `EditRegion`
- `features/user/screens/EditProfilePictureScreen` — route `EditProfilePicture`

**New: the first-run intro slideshow** (`S-01a`–`S-01c`), three slides shown once
before the Welcome decision. `firstRunStore` holds the flag; `App.tsx` keeps the
splash up until it answers so the wrong first screen never flashes.

**New: forgot-password and reset-password**, plus the deep link that carries the
emailed token into the app.

**Regenerated the bootsplash** from S-01 — the full lockup, and the background
moved from `#f4f1e4` to the design's `#F4F1EB`.

**Deleted:** `AccountRecovery` and `EmailOtpVerification`. The redesign removes
the only two links into them.

---

## Forgot-password: real contract, blocked on the backend

The contract is **real**, not proposed, and `authService.ts` already bound both
endpoints — nothing had ever called them.

```
POST /Auth/ForgetPassword  { Email, ClinetUrl }                          → 200, empty
POST /Auth/ResetPassword   { Email, token, Password, ConfemedPassword }  → 200, empty
```

The app sends `ClinetUrl = wahakun://reset-password`; AuthService appends
`?token=…&email=…` and emails that link; the deep link opens
`ResetPasswordScreen` with both params.

**🚩 It cannot complete on the current backend.** `ForgetPasswordasync`
publishes to RabbitMQ, which `docs/backend-wiring.md` says is deliberately not
installed, so a request for a _valid_ email never returns — measured at 60s with
no response. The app times out at 15s and shows a connection error. An email
that does not exist answers 500 in 0.4s.

The same bug hits `PUT /User/update`, where it is worse: the row **saves** and
then the request hangs, so the farmer is told it failed over data that is
already correct. Both are written up in `BACKEND-CONTRACT-REQUESTS.md`.

**To finish this feature:** run RabbitMQ next to AuthService and UserService, or
stop making the HTTP response wait on the broker. No client change is needed.

**No Figma exists for either screen** — not on the Farmer 2 page, not in the
exports. Both were composed from S-03b's grammar (same header, centred
heading/body, same field, same pinned CTA). Worth a design pass.

---

## Verified on an emulator

Against the real AuthService and UserService on this machine.

|                                |                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Bootsplash                     | new lockup, correct ground, not cropped at 192dp                                                                                  |
| Intro slideshow                | all three slides, swipe and tap, dots right-to-left, finish → Welcome, flag persists                                              |
| Welcome                        | cards, shadda copy fixes, both footer links                                                                                       |
| Phone login                    | layout, separator, secondary button, mail icon leading on the right                                                               |
| Email login                    | centred "نسيت كلمة المرور؟", two-tone footer link                                                                                 |
| Forgot-password                | content, invalid-email validation, **server error state against a real 500**                                                      |
| Deep link                      | `wahakun://reset-password?token=…&email=…` cold-starts into ResetPassword with both params                                        |
| Reset password                 | mismatch validation, and the real server's rejection of a bad token                                                               |
| **Email login end to end**     | **real credentials → tokens stored → Home. Existing auth is intact.**                                                             |
| Profile                        | avatar edit badge renders as S-07 draws it                                                                                        |
| Region editor                  | opens from S-07 (no longer dumps into the wizard), saves, **persisted server-side**                                               |
| Wizard                         | steps 1–4, labels, progress bar, role selection states                                                                            |
| Avatar upload                  | real MinIO + MediaStorageService; `filePath` confirmed as the objectName                                                          |
| **Forgot-password, full loop** | **request → 200 → real token off the broker → deep link → new password set in the app → old password rejected, new one accepted** |

`npm run verify` is clean: typecheck, lint, 20 suites / 156 tests.

**Two bugs were found by running those services and are fixed on this branch:**

- A saved avatar would never have rendered. `resolveAttachmentUrl` only recovers
  a key beginning with the bucket name — true of reports (folder `reportimage`),
  false of avatars (folder `profile-pictures`) — so the key came back bare and
  the `Image` had nothing to load. `resolveProfilePictureUrl` now handles our own
  uploads and defers everything else to the shared resolver.
- A picture-only `User/update` is rejected by SQL because the backend rebuilds
  `Address` from the request body and nulls two NOT NULL columns. `save()` now
  always carries the current address. See item 2 in
  `BACKEND-CONTRACT-REQUESTS.md`; the workaround should go once that is fixed.

## Not verified, and why

- **Registration OTP (step 5) and RegistrationSuccess** — needs a real Firebase
  SMS. Not sent.
- **Login OTP screen** — same.
- **Avatar save-through** — blocked on the backend, not the app. The upload half
  works against real MinIO and MediaStorageService, and `User/update` no longer
  hangs (204 in ~1s with RabbitMQ up), but the picture is silently dropped:
  `AppUser.pictures` and the DTO's `Picture` differ by the trailing `s`, so
  AutoMapper maps neither direction. Proved with a control — one request carrying
  both `fullName` and `picture` saved the name and not the picture. Two
  `ForMember` lines fix it; see item 3 in `BACKEND-CONTRACT-REQUESTS.md`.
- **Email delivery** — NotificationService will not start here: it wants
  `NotificationService/Firebase/firebase-adminsdk.json`, which is gitignored and
  absent. Everything up to the broker is verified; the last hop to SMTP is not.
- **iOS** — this is a Windows machine. The deep-link scheme, the `openURL`
  handler in `AppDelegate.swift` and the regenerated `BootSplash.storyboard`
  are written but have never been compiled.

## Known deviations from Figma

Deliberate, each one held against the repo's own rules:

- **Contrast.** Figma's N400 placeholder, N500 `أو` and `#EA2A2A` error text all
  fail 4.5:1 on `#F4F1EB`. The repo's AA stops are kept instead. An empty OTP box
  uses N550 rather than N400 for the same reason — its border is the only thing
  marking it as a control.
- **`h3`/`h4` line heights.** The new Figma sets every Cairo heading at a 1.25
  ratio; the theme's `h3` (24/40) and `h4` (18/30) do not match. Rather than
  change two variants used 33 times across reports, map and community,
  `h3Compact` and `h4Compact` were added and used only here. Worth unifying
  later, in its own pass, with those screens re-checked.
- **Splash logo 192dp, not S-01's 250** — Android crops a splash logo above that.
- **One black heading.** `Profile Setup - 1` sets its heading to `#000000` where
  every other heading in the file is `#363939`. Read as a slip and mapped to
  `textStrong`.
- **Country-code chevron.** The API shows a `chevron-down` on the phone field;
  the PNG does not. The existing country picker was kept — dropping it would
  remove function with no replacement.
- **Intro active dot** is G700 on all three slides; Figma uses G700 on the first
  and G500 on the other two.

## Follow-ups

- Region and picture are empty for every new account until the farmer edits them.
  See item 3 in `BACKEND-CONTRACT-REQUESTS.md` for the coordinates proposal.
- `useRegistration` still sends `Region`/`village` as `""`. Required, not
  optional: `AddressConfig` marks both `IsRequired()`, so null throws on save.
- `RegistrationDraft` still carries `governorate`, `location` and `profileImage`.
  Nothing in the wizard writes them now.
- Both OTP screens still carry the pre-existing `TODO` about a resend endpoint.
