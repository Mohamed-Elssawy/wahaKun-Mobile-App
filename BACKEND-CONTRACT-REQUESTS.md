# What the app needs from the backend

Plain notes for the backend teammate. Nothing here is urgent enough to block the
app — every screen works today on mock data — but each item is something the
phone cannot do on its own.

Checked against `origin/master` of the backend repo on **2026-09-28**;
items 12-15 added 2026-10-06 against `7e8a8b2`, after `ExpertController` landed;
item 18 and the measurement in item 12 added 2026-10-07 by the integration dry
run, which fed every mapper the payloads from `BACKEND-INTEGRATION-FACTS.md` §4
and the error bodies from `FARMER-BACKEND-REVIEW.md` F5 without a server.

**Item 12 is the priority.** It is the only thing on this list the app cannot
work around, and the dry run measured exactly what it costs.

A longer, field-by-field version of the feed and issue shapes is already in
`docs/issue-service-response-spec.md`. This file is the short list of what
changed since then, plus three bugs.

---

## The good news

Most of this is already written. `IssueService` has a `FarmerService` that
returns everything the community feed draws — title, description, image, author
name and photo, priority, status, and the comment, vote and share counts. It
resolves the author over gRPC and counts the rest from the database.

The app already has the matching types, copied field for field from
`GetIssuesREsponseDto`. Nothing needs redesigning.

---

## 1. The feed has no web address

**This is the one that matters most.**

`FarmerService.GetAllIssuesAsync` works, but no controller calls it, so the phone
has no URL to request. There is no `FarmerController` anywhere in `IssueService`.

**What we need:** a GET endpoint that calls it. Something like
`GET /api/Farmer/issues`, on the service already listening on port **5195**.

It should accept a page number and a page size, and return the page plus the
total, using the `PaginatedResult<T>` record that is already written.

Until this exists the app builds the feed out of `Map/ShowIssueInMap`, which has
no author and no counts, so every card shows zero.

---

## 2. Four fields the feed response is missing

`GetIssuesREsponseDto` covers most of a card. Four things it does not:

| What we need                                          | Why the screen needs it                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hasVoted` — has **this** farmer already confirmed it | The confirm button has two looks: outlined before, solid green with a tick after. Without this it always draws the "not yet" state, so a farmer who already voted sees the button invite them to vote again. `IIssueVoteRepo.ExistsAsync` already answers this. |
| `latitude` and `longitude`                            | The card shows "0.8 كم" — how far the problem is from the farmer. `GetAllIssues` already loads `GPSLocation`; the response just drops it.                                                                                                                       |
| Whether the report has a **voice recording**          | A photo report shows its photo. A voice report shows a microphone panel instead. Right now we cannot tell a voice report from a text-only one, so both look like a report whose photo failed to load.                                                           |
| `transcript` — the text of the recording              | The issue details screen has a section titled "النص من التسجيل" that shows what the farmer said. Nothing in the database holds this today. If the AI service already produces text from the audio, saving it would fill the section.                            |

---

## 3. Reading one issue

There is still no way to read a single issue back. `IssueController` only has
`create`, `analyze` and `delete`.

The phone keeps its own copy of what it filed, which means a farmer who changes
phone sees nothing, and nobody can open someone else's report properly.

**What we need:** `GET /api/Issue/{id}`, returning the same fields as the feed
plus the AI diagnosis and the status history.

---

## 4. The issue tracker must check who is asking

The issue details screen has a "تتبع كامل" link that opens the full tracker
(screen F-06): repair scheduling, the assigned expert, the history.

**Only the farmer who filed the report may see that.** Another farmer opening the
same issue from the community feed must not.

The app hides the link for everyone else, but **hiding a button is not security** —
anyone can call the endpoint directly. So whatever endpoint serves the tracker
has to check the signed-in user against the report's `ReporterId` and answer
**403** when they do not match.

---

## 5. Three bugs we found while reading the code

**a. The feed filter can never match anything.**
In `GetAllIssues`, the three conditions are joined with AND:

```
Status == completed  AND  Priority == Critical  AND  Status == Assigned
```

A status cannot be both `completed` and `Assigned`, so any filtered request
returns an empty list. These probably need to be OR, or separate filters.

**b. The comment count is never sent.**
In `CommunityHub.GetCommentCurrentCount`, the count is worked out and then not
included:

```csharp
var count = await CountService.GetCommentCountAsync(issueId);
await Clients.All.SendAsync("ReceiveCommentCount", issueId);   // count missing
```

`GetCurrentShareCount` right below it does send it, so this looks like a slip.

**c. A crash when the moderation service is down.**
In `CommunityHub.SendComment`, `moderation.IsFlagged` is read **before** the
`if (moderation is null)` check underneath it. When the AI service on port 8000
is unreachable, `ModerateAsync` returns null, and the line above throws a
`NullReferenceException` instead of the friendly message that was intended.
Moving the null check above it fixes it.

---

## 6. Things that only work over SignalR

Confirming a problem, sharing it, and posting a comment all exist — but only on
`CommunityHub` over SignalR, not as normal web requests.

That is fine, and we can connect to the hub. It is written down here only so it
is clear the app is not missing them by accident: the phone has no SignalR
library installed yet, so those three buttons currently report that they are
unavailable rather than pretending to work.

If adding plain POST endpoints for them is easy, that would be simpler for us
than adding a SignalR client. Either way works.

---

## 7. Posting a comment needs a service we do not have

`CommunityHub.SendComment` sends every comment to
`http://localhost:8000/api/v1/moderate` first, and refuses the comment if that
service does not answer.

That service is not in the backend repo, and it is not the same as the vision
service on port 8001. Until we have it, comments cannot be posted at all — not
even a harmless one. Where does it live?

---

## 8. The app cannot tell a farmer from an expert

`UserDetailsResponse` returns id, name, email, phone, picture, village and
region — and no role. The app needs to know which of the two it is talking to
before it can show the right home screen, so please add the account's role and,
for an expert, its approval status to that response.

Both already exist on your side. Roles are in the Identity tables, and
`TokenService.GenerateAccessToken` already puts them in the JWT. `AppUser.Status`
is set to `UserStatus.Pending` when an expert registers. Neither reaches any
response the phone can read.

Until then the app serves a role from a mock and treats every account as a
farmer, so the expert side is unreachable on a real login.

## 9. A reopened issue has no `IssueStatus` value

When a farmer says a repair did not work, the issue goes back to the expert's
queue. `IssueStatus` has no value that means that, so the phone cannot store it
and cannot recognise it coming back. A `Reopened` value would cover it.

## 10. Nothing says whether the expert has reviewed an issue yet

`Assigned` covers both "an expert has it and has not looked at it" and "an
expert has reviewed it and has not scheduled the repair". Those are two
different screens for the expert and two different lines for the farmer, so the
phone needs them apart — either a new `IssueStatus` value or a flag on the
issue.

## 11. What does `IssueStatus.Verified` mean?

It sits between `Diagnosed` and `Assigned`, and nothing in our spec verifies an
issue before routing it to an expert. The app currently treats it the same as
`Diagnosed`. If it means something specific, we would rather draw it properly.

## 12. `IssueService` has no exception handling, so every refusal is a 500

`IssueService/Program.cs` is `AddControllers()` → `UseAuthentication` →
`UseAuthorization` → `MapControllers`. There is no `UseExceptionHandler`, no
`IExceptionHandler`, and the controllers have no `try/catch`. So each of these
reaches the phone as a bare 500 with a stack trace in the body:

| thrown by `ExpertService` | should be | is |
| --- | --- | --- |
| `KeyNotFoundException("No issues were found.")` | 404, or better an empty list | 500 |
| `InvalidOperationException("Only assigned issues can be reviewed.")` | 409 | 500 |
| `InvalidOperationException("Resolution action can only be created for a scheduled issue.")` | 409 | 500 |
| `UnauthorizedAccessException("You are not assigned to this issue.")` | 403 | 500 |

The phone cannot tell a refusal from an outage, because the status carries
nothing. `expertService.ts` therefore matches on the exception text in the body,
in three places, each marked and each deletable the day this changes. Those
matches only work at all because `ASPNETCORE_ENVIRONMENT=Development` makes the
developer exception page echo the message; under any other environment the body
is empty and they stop matching silently.

**Measured, 2026-10-07.** `src/api/__tests__/wireErrors.test.ts` drives the real
bodies through `client.ts`. With the Development body all three matches work, and
an empty inbox reaches the screen as an empty list. With an **empty** body —
which is what every other environment returns, because the developer exception
page is the only thing that echoes the message at all — `serverMessage` stays
`undefined`, all three matches fail at once, and:

- a new expert's empty inbox becomes `حدث خطأ في الخادم، حاول مرة أخرى لاحقاً`,
  a red error on the first screen they ever see;
- a second review submission, and a resolution on an unscheduled case, both tell
  the expert to try again later — for an action that will fail forever.

Nothing crashes, and that is the whole of the good news. **This is why item 12 is
the priority on this list**: deploying `IssueService` properly is what breaks it,
so it gets worse the closer the project gets to done, and there is no signal left
on the response for the app to branch on instead. That test is the thing that
fails first if the server configuration changes.

The full request, with the `Program.cs` change that fixes every row above, is
item 6 of `BACKEND-GAPS-FOR-TEAMMATE.md`.

**Separately: an empty result is not an error.** `ExpertService.GetAllInboxAsync`
throws rather than returning an empty page, so a new expert with no assigned
cases looks identical to a failure. Returning an empty list with `totalCount: 0`
would mean nothing has to be interpreted at all.

## 13. The expert's review has nowhere to put the correction

`SubmitExpertReviewRequest` is `(Decision, Notes)`. When an expert overrides the
AI they supply a corrected severity *and* a corrected diagnosis, and neither has
a field. The app currently encodes both into `Notes` and parses them back out on
read — see the `BACKEND-GAP G3` comments on `composeReviewNotes` and
`parseReviewNotes`. Two nullable columns on the request and the response would
delete that encoding and both halves of the parser.

## 14. `CaseReviewResponse` cannot be read back into the expert's own screens

Two fields are missing for E-05 and E-06, which show the expert what they sent
the farmer:

- **the repair schedule** — `scheduledDate`, `slotStart`, `slotEnd` and the note
  are written by `POST /Expert/{id}/schedule` and never come back on any read.
- **`attachments[].purpose`** — the farmer's problem photo and the expert's
  repair proof are indistinguishable, so the only heuristic left is insertion
  order.

Both screens currently show what the app itself wrote during that session, which
is lost the moment the app restarts.

## 15. `PaginatedResult.PageCount` is the item count

`pageCount` carries the number of items on the page, not the number of pages, so
nothing can paginate off it. The app pages off `totalCount` instead. Worth
renaming or fixing before another client reads it the way the name suggests.

## 16. Filing a report should always create a record

This is the one that changes what the farmer sees, so it is the one worth reading
first.

`POST /Issue/analyze` maps the vision service's Arabic severity onto an
`IssuePriority` and then enqueues the issue creation **only when that priority is
Medium or higher**. The four minor severities — `بسيطة`, `بسيطة جداً`,
`غير مؤثرة`, `غير معروفة` — produce a diagnosis and no issue at all. So does any
severity the mapping does not recognise, because it ends in
`_ => IssuePriority.Unknown`.

From the phone this looks like data loss. The farmer photographs a problem, reads
a real diagnosis, and the report never appears in بلاغاتي, because on the server
it does not exist. Nothing failed and nothing said so.

We think discarding those reports is a bug rather than a filter. A low-severity
problem is still a problem the farmer reported, it is still worth a record, and
the severity is already on the issue if anything later wants to sort or hide by
it. **Please create the issue for every severity** and let the client decide what
to show.

Until then the app keeps those reports in a local mirror on the device, so the
farmer is not told their own submission vanished. That mirror is the only thing
holding them, so it is lost with the app's data, and it is only on the phone that
filed them.

**The deletion condition, which matters if you change this.** بلاغاتي shows the
server's list concatenated with the mirror's rows, and it does no matching
between them, because today the two sets cannot overlap: the mirror holds only
what the server refuses to create. The moment `analyze` starts creating issues
for Low and Unknown, every such report appears **twice** — once from each half.
So tell us when this lands and the mirror comes out in the same change. The
invariant is written on both halves of `reportService.ts`.

## 17. The farmer's issue list carries no photo and no diagnosis

`GetFarmerIssues` returns `issueId`, `title`, `description`, `createdAt`,
`status`, the schedule fields and the expert's name — but **no `attachments[]`
and no AI analysis**. Two consequences:

- A report card in بلاغاتي has no photo to draw, and no severity, because there
  is no priority on the row either.
- Opening a report the farmer filed on this device shows the diagnosis, and
  opening the same report after the app restarts does not, because the analysis
  only ever existed in the local mirror.

That split is unfixable client-side. Creation is asynchronous and returns no id,
and the row carries no photo URL, so there is nothing to join the local record to
the server's on — one report ends up addressable two ways, with different data on
each. **The attachment URL and the AI analysis on `GetFarmerIssues` would close
it**, and it is the same analysis `GET /Expert/{id}/review` already returns, so
the mapping exists.

## 18. Two fields on the write responses the app cannot act on

Not a gap in the data — both are already returned. The app discards every one of
the three write responses, because `submitReview`, `confirmAppointment` and
`confirmRepair` are each `Promise<void>`. Worth writing down because two of the
fields in them are the only copy of something:

- **`SubmitExpertReviewResponse.status`** comes back as the string `"Reviewed"`.
  The app currently *assumes* the transition succeeded and repaints E-03 from its
  own state. Reading the status back would let it confirm instead of assume,
  which matters because the endpoint refuses unless the issue is exactly
  `Assigned` and the refusal is indistinguishable from an outage (item 12).
- **`RepairScheduleResponse.id`** is the only handle on the `RepairSchedule` row
  that call just inserted. Every `POST /Expert/{id}/schedule` inserts a new row
  rather than updating the existing one, so the day there is a proper
  reschedule-by-id — or any way to read a schedule back (item 14) — this id is
  what it will need, and by then the ids of every row written before that day are
  gone.

Nothing is asked for here. Keep both fields on the response; the app will start
reading them when items 12 and 14 make it worth doing.
