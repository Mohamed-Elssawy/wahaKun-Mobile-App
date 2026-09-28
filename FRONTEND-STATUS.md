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
