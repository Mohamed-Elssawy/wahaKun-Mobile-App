# Frontend status

What is built, what it is running on, and exactly what it takes to put each unit
on the real backend. One section per unit, newest last.

Read with [ARCHITECTURE.md](./ARCHITECTURE.md) — the seam described there is what
makes every "wire it up" step below a service change and never a screen change.

---

## Global demo mode

One switch puts the **whole app** on mocks, for a demo with no backend running:

```ts
// src/config/env.ts
export const DEMO_MODE = true;
```

Every per-feature flag ORs against it (`USE_MOCK_REPORTS`, `USE_MOCK_COMMUNITY`,
`USE_MOCK_USER`, `ENABLE_COMMENT_POSTING`), so nothing else needs touching and
nothing needs putting back afterwards.

Two things it does beyond flipping flags, both found by running it on a device:

- **It boots straight to `Home`.** Auth has no mock — `AuthService` and Firebase
  are the only ways to get a token — so otherwise the demo stops at the login
  screen and never reaches a flag.
- **It mocks UserService.** That service is the only thing that answers "who am
  I", so without it the header has no name, the profile is empty, every comment
  falls back to the placeholder author, and F-04's tracker link can never show.

It is a committed constant defaulting to `false`, not the hardcoded
`initialRouteName` boot shortcut that must never be committed.

### Walking the four UI states

`DEMO_MODE` gets you content. To see the other three:

```ts
// src/config/env.ts
export const MOCK_SCENARIO: MockScenario = 'content'; // 'empty' | 'error' | 'slow'
```

| Value     | What every mock does                                                |
| --------- | ------------------------------------------------------------------- |
| `content` | normal seeded data                                                  |
| `empty`   | every list comes back empty — the empty frames                      |
| `error`   | every read throws a network `ApiError` — the offline frame (X-01)   |
| `slow`    | every call takes 6s, so the loading state is long enough to look at |

Implemented once in `src/api/mockScenario.ts`, so a new feature mock gets all
four by calling `mockDelay`, `failOnErrorScenario` and `emptyOnEmptyScenario`.

---

## Unit: Community Feed + Issue Details

**Screens:** F-01 Community Feed, F-04 Issue Details
**Branch:** `feature/community-figma-rework`
**Design source:** `design/figma-exports/Farmer Screens V2/` (screenshots — the
Figma REST API rate-limited on the starter plan partway through; the page and
frame index came from the API, every measurement from the exports)
**Per-feature flag:** `USE_MOCK_COMMUNITY` (currently `true`)
**State:** running on the mock

### What it runs on now

| Piece                                | Source                                     | Real?                                 |
| ------------------------------------ | ------------------------------------------ | ------------------------------------- |
| Comment list                         | `GET /api/Community/GetCommentsByIssueId`  | **real, already bound**               |
| Feed                                 | `Map/ShowIssueInMap`, composed client-side | real transport, thin data             |
| Author, counts, vote state, distance | mock only                                  | —                                     |
| Confirm / share / post comment       | mock only                                  | real on `CommunityHub`, not reachable |
| Voice recording + transcript         | mock only                                  | no endpoint exists                    |

### Contract source: REAL, but not reachable

The wire types in `features/community/types.ts` are copied field for field from
`IssueService/Issue.Shared/DTOS/FarmerDtos/GetIssuesREsponseDto.cs` on
`origin/master`, **not** invented here. `FarmerService.GetAllIssuesAsync` is fully
implemented — author over gRPC, counts from the database — but **no controller
exposes it**, so there is no URL to call.

Four fields that DTO cannot supply are split into `FeedItemWireProposed` and
marked PROPOSED: `hasVoted`, `latitude`/`longitude`, and a voice-vs-text flag.
The transcript is PROPOSED too. All five are written up in
[BACKEND-CONTRACT-REQUESTS.md](./BACKEND-CONTRACT-REQUESTS.md).

The three writes are real on `CommunityHub` over SignalR at `/hubs/community`.
No SignalR client is installed, so the real service throws a documented 501 for
each rather than resolving — a control that silently does nothing is worse than
one that reports it cannot.

### Wiring it to the real backend — the checklist

**1. The feed.** Once `GET /api/Farmer/issues` (or whatever it is called) exists:

- add the path to `API_ENDPOINTS` in `src/api/endpoints.ts`, spelled exactly as
  the controller spells it
- add its port to `PORTS` in `src/config/env.ts` (**5195** per that service's
  `launchSettings.json`) and a matching entry in `API_BASE_URLS`
- in `features/community/services/communityService.ts`, replace `getFeed`'s
  `getMapIssues()` composition with one `apiClient.get<PaginatedWire<FeedItemWire>>`
  and map `FeedItemWire` onto `FeedPost`
- delete `FeedItemWireProposed` as each of its fields lands on the real DTO

**2. Check the contract actually matches.** Set `USE_MOCK_COMMUNITY = false` and
run the feed. `CommunityApi` is the annotation on `services/index.ts`, so a
signature drift fails to compile — but a _field_ that arrives `undefined` will
not. Check the author name, the three counters and the distance specifically.

**3. The writes.** Either add plain POST endpoints (simplest for us), or
`npm i @microsoft/signalr` and implement `toggleConfirm`, `shareIssue` and
`postComment` against the hub, replacing the three `hubUnavailable()` throws. The
hooks are already optimistic, so nothing above the service changes.

**4. Comment posting** additionally needs the moderation service on `:8000`
running. Then set `ENABLE_COMMENT_POSTING = true` and the composer enables
itself — the component already reads that flag.

**5. Issue details.** `useIssueDetails` falls back to `communityApi.getIssue`,
which today wraps `Map/SearchForIssueInMap`. When `GET /api/Issue/{id}` exists,
change `getIssue` only. The screen does not move.

**6. Flip the flag.** `USE_MOCK_COMMUNITY = false`. That is the whole switch.

Nothing in steps 1–6 touches a screen or a component.

### Known gaps, deliberate

- **`isExpert` is always `false`** on the real path — `UserDetailsResponse` has no
  role, so the `خبير معتمد` badge cannot be earned yet. The mock has one.
- **The `تتبع كامل` link points at `ReportDiagnosis`**, because F-06 Issue Tracker
  is not built. It is a one-line change in `IssueDetailsScreen` when it is.
- **That link is gated on identity**, not on the local mirror — see
  `features/reports/ownership.ts`. The server must enforce it too; hiding a
  control is not protection.
- **Empty and error for F-01 are not drawn in Figma.** X-06 and X-01 are the
  My Issues and global frames; F-01 reuses their pattern via `ReportsEmptyState`
  and `ReportErrorView`.
- **Three colours are approximated**, flagged rather than invented: the card meta
  line samples `N600`, which has no semantic token and fails 4.5:1, so it uses
  `textMuted`; the chip border uses `borderControl` rather than the decorative
  `N400` the frame samples, since a chip is a control; the composer placeholder
  uses `textPlaceholder` rather than `N500`.

---

## Shared UI

**Branch:** `refactor-shared-ui-extraction`
**Screens:** none. This unit changed no screen's behaviour and, with two recorded
exceptions, no screen's pixels.

`src/components/ui/` is now the design system. Nineteen components moved in or
were created; every duplicate they replaced is deleted, not re-exported.

| In `components/ui/` | Replaced                                                                      |
| ------------------- | ----------------------------------------------------------------------------- |
| `SeverityBadge`     | `reports/SeverityBadge` + `community/TierBadge` + `community/SeverityDroplet` |
| `StatusChip`        | `community/StatusPill`                                                        |
| `ProgressRing`      | `reports/ProgressRing`                                                        |
| `ConfidenceRing`    | `reports/ConfidenceGauge`                                                     |
| `ConfidencePill`    | `reports/ConfidencePill`                                                      |
| `AiDiagnosisCard`   | `reports/DiagnosisCard`                                                       |
| `VoicePlayer`       | `reports/VoicePlayerCard`                                                     |
| `VoiceWaveform`     | `reports/VoiceWaveform`                                                       |
| `ReportSummaryCard` | the card inlined in `reports/ReportRow` and `map/MapPeekCard`                 |
| `SegmentedTabs`     | `reports/ReportFilterTabs` + `community/FeedStatusTabs`                       |
| `FilterChip`        | `community/FeedChip`                                                          |
| `FilterChipRow`     | the scrolling shell inlined in `community/FeedChipRow`                        |
| `EmptyState`        | `reports/ReportsEmptyState`                                                   |
| `StateScreen`       | `reports/ReportFailureState`                                                  |
| `InlineFieldError`  | the error row inlined in `ui/TextField`                                       |
| `ButtonSpinner`     | the `ActivityIndicator` inlined in `ui/Button`                                |
| `ContextChip`       | nothing - new, SYSTEM-SPEC §6.4                                               |
| `StaleBanner`       | nothing - new, API only ahead of U15                                          |
| `ListSkeleton`      | nothing - new, API only ahead of U15                                          |

**The seam.** No file in `components/ui/` imports from `features/`, `api/`,
`navigation/` or `hooks/`. Primitives take presentation props - a `ColorToken`, a
formatted label - and each feature keeps the mapping from its own domain. That is
what let `IssueDetailsScreen` stop reaching into `features/community` for a badge.

**What stayed in its feature, and why.** `ReportErrorView` branches on
`ReportError.kind` from the reports error taxonomy, so it fails ARCHITECTURE rule
2; all ten of its callers are untouched. `FeedChipRow` owns Arabic sort copy and
reads `describeTierDisplay`. `QueuedReportRow` is a different card from
`ReportSummaryCard`. `CollapsibleCard` shares `AiDiagnosisCard`'s chrome but owns
a `LayoutAnimation` and a touchable header.

**The flag guard.** `src/config/__tests__/env.test.ts` fails `npm run verify` if
`DEMO_MODE` or `MOCK_SCENARIO` is ever committed in a demo state. `main` is the
public build against the real backend, and every other mock flag is
`DEMO_MODE || ...`, so pinning those two holds the rest down.

### The two deliberate pixel changes

Both were approved before the build, and both are the frame being obeyed:

1. **F-03a and F-04's severity badge gains the droplet glyph** and steps from
   24/`label12Bold` to 26/`h6`. `reports/SeverityBadge` rendered a label-only
   pill; F-01's badge and F-03a's are the same pill in the V2 exports, and
   SYSTEM-SPEC §6.2 requires severity to carry shape as well as colour.
2. **`ReportFailureState`'s dead `tone="success"` is gone.** Nothing passed it.
   Its replacement, `register="warm"`, uses F-03c's greens rather than the
   `LG100/LG700` the dead branch had.

### Wiring it to the real backend

Nothing. This unit touched no service, type, endpoint or flag default.

---

## S1 — the lifecycle model, the account role, and the expert shell

The report state machine of SYSTEM-SPEC §3 as a pure module, role on the
identity, §4.1's routing table, and the expert shell with three empty tabs.

### What the model owns

`src/features/reports/lifecycle/` is the single answer to every question a
screen asks about a case. It imports nothing from another feature, nothing from
`api/`, and no React, so it is tested directly: 108 tests over the six files.

| File             | Owns                                                         |
| ---------------- | ------------------------------------------------------------ |
| `statuses.ts`    | §3.2's six statuses, the `IssueStatus` map, the 80% constant |
| `nodes.ts`       | §3.3's six nodes and `LifecycleFacts`                        |
| `transitions.ts` | §3.5's T1–T15 with guards                                    |
| `refusals.ts`    | §3.6 as codes                                                |
| `permissions.ts` | §10.7's write matrix                                         |
| `selectors.ts`   | the seven selectors every screen reads                       |
| `display.ts`     | status and severity to labels, glyphs and tokens             |

Status alone cannot place a case: `جديدة`, `قيد المراجعة` and `مجدولة` each span
two nodes. So the model takes `LifecycleFacts` — the status plus four booleans —
and `currentNode` is the only thing that resolves it. Nothing downstream
re-derives a status or a node.

A refusal is a returned code, never a throw, because a model that throws cannot
be called from a render path and none of §3.6's clauses are errors a farmer
should read. `attempt()` returns `{ ok: false, refusal }` and the screen decides
whether that means hiding a control or saying something.

**The bug it found.** `status.ts` mapped `Repaired` onto `تم الحل`, so a case the
expert had repaired and the farmer had not yet confirmed read as solved on My
Reports, in the community filters and on the map. T6 leaves the status at
`مجدولة`; only the farmer's tick at T7 closes a case. `status.ts` is deleted and
its seven consumers read the model.

### What is PROPOSED

| Field             | Where                   | Why it does not exist                                                |
| ----------------- | ----------------------- | -------------------------------------------------------------------- |
| `role`            | `UserDetails`           | `UserDetailsResponse` has no role; Identity has it, the DTO does not |
| `status`          | `UserDetails`           | `AppUser.Status` is set on register and reaches no response          |
| `hasExpertReview` | `LifecycleFacts`        | no `IssueStatus` value separates node 3 from node 4                  |
| `useUnreadChats`  | `features/expert/hooks` | no service answers it, so the dot is wired and false                 |

`Reopened` and `AdminClosed` have no wire value at all, so nothing reads them
off the server. All of it is filed in BACKEND-CONTRACT-REQUESTS.md, items 8–11.

### The flags

| Flag                      | Default  | Effect                                   |
| ------------------------- | -------- | ---------------------------------------- |
| `USE_MOCK_ROLE`           | `true`   | serve the account role from `MOCK_ROLE`  |
| `MOCK_ROLE`               | farmer   | which role the mock serves               |
| `MOCK_EXPERT_APPROVAL`    | approved | which §4.1 row an expert takes           |
| `ESCALATE_LOW_CONFIDENCE` | `true`   | hide a sub-80% diagnosis from the farmer |

`USE_MOCK_ROLE` is on by backend gap, the way `USE_MOCK_COMMUNITY` is, so the
committed build boots the farmer shell exactly as it did before. Set `MOCK_ROLE`
to `'expert'` to walk the expert shell on a device. `env.test.ts` asserts all
four, because an expert default would send every account to a shell of empty
placeholders and turning the escalation off would put uncertainty language back
in front of farmers without failing anything.

### The escalation, reinstated

`ESCALATE_LOW_CONFIDENCE` was read in zero places, so flipping it did nothing.
It is now on, and `features/reports/aiVisibility.ts` is the only place outside
`config/env` that reads it. Below 80%, or on a transcription failure, the farmer
gets §8.3's canonical escalation line and no AI output: F-03a's whole card,
F-04's hero severity, confidence ring, both diagnosis notes and its
`IssuePriority` badge, and My Reports' severity stripe and AI title. The expert
still sees the amber chip, which §8.3 calls the only sub-threshold view in the
product. The gate lifts once an expert has reviewed, per §10.2.

The farmer's own description survives an escalation and the AI-written title
does not, so the fallback runs description first and then T13's `بلاغ بدون وصف`.

**One surface is deliberately left.** F-01's feed cards still draw a tier badge
for other farmers' reports off `IssuePriority`. It is the same source as F-04's
hero badge, which this unit gates, but F-01 is a public feed of other people's
reports rather than the reader's own, and §10.2's row is about the reader's
diagnosis. Worth settling when F-01 is next touched.

### Routing and the shell

`navigation/routeForIdentity.ts` is §4.1 as a pure function, and boot and both
login screens go through it, since §4.1 is taken at S-01 and after every
authentication. Two routes it needed are new: S-08 as a root route, because an
unapproved expert must reach no shell, and X-01 as the cold-start guard, with a
retry that re-runs the decision. Two rows §4.1 does not have are decided in
that file and commented: an unreadable role goes to X-01 rather than defaulting
to farmer, and a failed first-run read still boots Welcome.

`BootRoute` is still an `Extract` over the route table, so the `initialRouteName`
shortcut cannot be committed through that prop. It is now a `BootDecision`, so
S-08 arrives with the state it has to draw.

The expert shell is `ExpertTabs` plus three chrome-only screens, not
placeholders, so a later unit replaces a body and never the shell. The unread
dot is drawn into the `المحادثات` glyph because `tabBarBadge` draws a red
numeric pill where §8.3 asks for a green dot.

### Wiring it to the real backend

Deleting one branch in `features/user/role.ts` and setting `USE_MOCK_ROLE` to
`false`, once `UserDetailsResponse` carries the two fields. `roleFromDetails`
is already written and tested against both the names and the ints, since
`UserStatus` would arrive as a number the way `IssueStatus` does.

---

## S2 - report tracker: F-06, X-05, F-07's contextual slot

**Screens:** F-06 Report tracker (new route `ReportTracker`), X-05 Location
denied (inline in F-02, not a route), F-07's contextual slot and node-6
approval control.
**Branch:** `feature/report-tracker`, cut from `develop` after fast-forwarding
`feature/lifecycle-and-expert-shell` into it (develop had no lifecycle model
on it yet - see REFERENCE-NOTES.md).
**Design source:** the local V2 exports under `Waha KUN Figma Designs V2/`;
the Figma REST API was not called this session - the exports already matched
the spec text on every value checked, and a live call risked the file-nodes
rate limit for no gain.
**Per-feature flag:** `USE_MOCK_TRACKER` (`DEMO_MODE || true`)

### What it runs on now

Everything F-06 needs beyond the bare `Report` - expert, appointment, repair,
and the confirm/reject writes (T7/T8) - is **mocked in full**.
`IssueController` has no read endpoint of any kind
(BACKEND-CONTRACT-REQUESTS item 3), so there is no partial-real state to
describe here the way the community feed has.

`ReportTrackerDetails` is new and entirely PROPOSED. `reportService.ts` grows
three stub exports (`getReportTracker`, `confirmResolution`,
`rejectResolution`) that throw the documented "no endpoint" error, same shape
as `getMyReports`'s existing guard, so the real path fails loudly rather than
silently if the flag is ever flipped early.

### The model, reused, not re-derived

`trackerFacts.ts` is the only new thing that may construct a `LifecycleFacts`
besides S1's own `factsFromWireStatus` - it exists because
`ReportTrackerDetails` can say `hasExpertReview` directly, where a bare wire
status cannot. `trackerView.ts` then turns facts into F-06's six node
descriptors (label, marker state, datetime, chips) and F-07's one contextual
slot - formatting only; every status/node answer still comes from
`currentNode`/`publicStepperNode`. No component below it holds a status
string, a node number, or a label of its own.

### F-07's contextual slot costs a tracker fetch per active row

`useMyReports` now also loads `ReportTrackerDetails` for every open report
after the list resolves, so the chip and the `TrackerApprovalControl` can
render. There is no batched endpoint to ask for this instead. Fine against
the mock; the first thing to flag if F-07 ever needs to scale past a page
against the real backend.

### X-05 changed a standing decision, not just added a screen

M6 (2026-07-28) decided a refused location permission must never block a
report. §8.4 X-05/`D-HARD-BLOCK` says the opposite, and this session was
explicitly asked to build it that way. `useCurrentLocation` now returns
`{ location, status, recheck }` instead of a bare coordinate, re-checks on
`AppState` returning to `active` (so granting the permission in Settings is
picked up without backing out of the capture screen), and
`ReportCaptureScreen` renders `LocationPermissionDenied` - no tertiary link,
per `D-HARD-BLOCK` - ahead of every other capture state once `status` is
`'denied'`. Three other hooks (`useOasisMap`, `useCommunityFeed`,
`useIssueContext`) destructured the old bare-value shape and needed updating
to match; `npx tsc` caught all three.

### Known gaps, deliberate

- **F-06's two CTAs:** `التواصل مع الخبير` opens the existing `ConnectToExpert`
  placeholder (F-08 is out of scope this sprint); `عرض التعليقات (N)` opens
  F-04 without scrolling to the thread - F-04 is untouched this session
  (`B-TRACK` is not in this unit's read list).
- **Node 1's evidence chip has an inferred photo variant.** §8.2 only gives
  the voice copy (`🎤 تم تسجيل ملاحظة صوتية...`); every seeded fixture is
  photo-based, so the mirrored photo line (`📷 تم إرفاق صورة للمشكلة...`) is
  what actually renders. Flagged in `trackerView.ts`; replace if a source
  ever gives the exact wording.
- **`state:reopened` and `state:expert-changed` are explicitly out of this
  session**, per the unit's own scope line. `rejectResolution`'s mock clears
  nodes 4-5 (`C-REOPEN-CLEAN`) and returns the case to node 3, but no screen
  renders that reverted state yet - the farmer stays on a timeline the model
  has already moved, until that session lands.
- **`formatAbsoluteDateTime` is hand-rolled**, matching `formatRelativeTime`'s
  existing approach rather than `Intl`, since full ICU data is not a given on
  Hermes and the repo already treats this as the house pattern.

### Wiring it to the real backend

1. `GET /api/Issue/{id}/tracker` (or whatever it is called) lands → add it to
   `API_ENDPOINTS`, implement `reportService.ts`'s three stubs for real, map
   the DTO onto `ReportTrackerDetails`, deleting PROPOSED fields as each one
   is confirmed on the wire.
2. Set `USE_MOCK_TRACKER = false`. Nothing else changes - `trackerFacts.ts`,
   `trackerView.ts` and every component read the type, not the source.
3. Confirm the server enforces the same ownership check `isReportOwner`
   already does client-side (BACKEND-CONTRACT-REQUESTS item 4) - hiding the
   `ReportTracker` entry points is not protection.

---

## S3 - expert triage + review: E-01, E-02

**Screens:** E-01 Expert Inbox, E-02 Case Review (new route `ExpertCaseReview`).
**Branch:** `feature/expert-queue-and-review`
**Design source:** the local V2 exports under `Waha KUN Figma Designs V2\`, per
the session's own prompt; now also committed under `design/figma-exports/`
with the `<id> · <name> · state=<x>` naming.
**Per-feature flag:** `USE_MOCK_EXPERT_QUEUE` (`DEMO_MODE || true`)
**State:** running on the mock, except `ملاحظات الخبير`'s public-comment post,
which is real.

### What it runs on now

| Piece                                    | Source                   | Real?                                                       |
| ----------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| Assigned-cases list, case detail          | `expertService.mock.ts`  | mock only - `IssueController` has no expert endpoint at all |
| Review submission (T4), the override      | `expertService.mock.ts`  | mock only                                                    |
| `ملاحظات الخبير` → public comment         | `communityApi.postComment` | real transport - the same `CommunityHub` path F-04 uses, gated on `ENABLE_COMMENT_POSTING` |

### The model, reused

`ExpertCaseSummary` extends `LifecycleFacts` directly, the same move
`trackerFacts.ts` makes for F-06, so `expertCtaFor`/`currentNode` take a case
straight off the inbox with no adapter. `expertCtaFor` is the only source of
every card's CTA (`C-CTA`); `AiConfidenceChip` is the only place a
sub-threshold diagnosis is visible anywhere (`C-CONFIDENCE-CHIP`);
`ExpertStepper` is the 4-node view of canonical nodes 3-6, wired on E-02 only
this session.

### Known gaps, deliberate

- **E-11** (the full diagnosis detail) is not built - `تتبع كامل` has nowhere
  to go yet.
- **The `مجدولة` card's `إعادة الجدولة` action is registered but inert** -
  rescheduling is its own unit, not this one.
- **A severity override repaints only the expert's own in-memory summary.**
  It never reaches a farmer surface this session, because
  `expertService.mock.ts`'s fixtures (ids 2001-2009) and the farmer's own
  report/tracker mocks (ids 1020-1050) are disjoint - the mock's own comment
  says as much. S4 closes this for exactly one shared id; see below.
- **No reschedule reason chips** (§8.3's `سبب التغيير` set) exist yet - tied
  to the same out-of-scope reschedule flow.

### Wiring it to the real backend

1. Once the assigned-cases, case-detail and review-submit endpoints land, add
   their paths, implement `expertService.ts`'s three stubs for real, map the
   DTOs onto `ExpertCaseSummary`/`ExpertCaseDetail`, and delete the fixtures.
2. The severity-override repaint becomes a real cross-role effect once both
   features read the same backend record - nothing to reconcile client-side,
   it was a mock-only seam.
3. Set `USE_MOCK_EXPERT_QUEUE = false`.

---

## S4 - expert schedule to closure: E-03, E-04, E-05, E-06

**Screens:** E-03 Schedule repair, E-04 Resolution confirmation, E-05 Awaiting
farmer approval, E-06 Case closed (new routes `ExpertSchedule`,
`ExpertResolutionConfirmation`, `ExpertAwaitingApproval`, `ExpertCaseClosed`).
**Branch:** `feature/expert-schedule-to-closure`
**Design source:** SYSTEM-SPEC.md §8.3's text and the existing E-02 screen's
pattern only - the Figma exports named in this session's own prompt were
never opened. Worth a pixel check against `design/figma-exports/E-03` through
`E-06` before calling this pixel-complete.
**Per-feature flag:** `USE_MOCK_EXPERT_QUEUE` (same flag as S3, extended with
`confirmAppointment`/`confirmRepair`)
**State:** running on the mock, same backend gap as S3 - appointment, repair
proof and the farmer notification are all in-memory only, on both sides.

### What it runs on now

| Piece                              | Source                  | Real?                                                        |
| ----------------------------------- | ------------------------ | ------------------------------------------------------------- |
| Appointment confirm (T5), repair confirm (T6) | `expertService.mock.ts` | mock only |
| Farmer notification                 | declared as a T5/T6 model effect only | not built - no `NotificationService` call exists anywhere in the client |
| Photo pick                          | `useImagePicker` (camera + gallery) | real - the same hook F-02 uses |
| Photo upload                        | -                        | no multipart call anywhere; the mock keeps the picked image's own local `uri` |

### The model, reused

T5/T6 are wired onto the S1 model through `attempt()`, the same guard
`useResolutionAction` already applies to T7/T8 on the farmer side.
`scheduleWindow.ts` is new but owns no new model concept - a pure resolver
sitting next to the S1 model the way `trackerFacts.ts` does, computing
`C-WINDOW` off the filing date's local calendar day.

### Known gaps, deliberate

- **`E-03 · state:reschedule` is explicitly out of scope.** The `مجدولة`
  card's `إعادة الجدولة` button from S3 stays inert.
- **No chat exists.** `ملاحظة للمزارع` is persisted on the case
  (`ExpertAppointment.noteToFarmer`) with a TODO that it becomes chat message
  1 once chat is built.
- **No notification surface exists.** `farmerNotified` is a declared effect
  on T5/T6 only; nothing calls `NotificationService` - its port is configured
  in `env.ts`, but the client never requests it anywhere.
- **The cross-role DoD only holds for one shared mock id.** Report `2010` is
  seeded in `expertService.mock.ts`, `reportTracker.mock.ts` and
  `reportService.mock.ts` alike, with a write-through
  (`applyExpertAppointment`/`applyExpertRepair`) from the expert mock into the
  farmer tracker mock. Every other case the expert schedules stays invisible
  to that farmer's F-06 until both sides share a real backend id.

### Wiring it to the real backend

1. Once `confirmAppointment`/`confirmRepair` endpoints land, add their paths
   and implement `expertService.ts`'s two stubs for real.
   `confirmRepair` needs `timeoutMs: UPLOAD_TIMEOUT_MS`, not `API_TIMEOUT_MS`
   - same reasoning as `reportService.ts`'s `analyzeIssue`. Map the response
   and delete the PROPOSED `ExpertAppointment`/`ExpertRepair` fields as each
   lands on the real DTO.
2. Once the farmer tracker reads the same backend record, delete
   `applyExpertAppointment`/`applyExpertRepair` and the shared mock id `2010`
   - the real backend makes that bridge for free.
3. Confirm where `farmerNotified` actually fires - almost certainly
   server-side on the same endpoint call. Nothing to build client-side unless
   that assumption is wrong.
4. Set `USE_MOCK_EXPERT_QUEUE = false` once S3's and S4's methods are real
   together - they share one flag.
