# What the app needs from the backend

Plain notes for the backend teammate. Nothing here is urgent enough to block the
app — every screen works today on mock data — but each item is something the
phone cannot do on its own.

Checked against `origin/master` of the backend repo on **2026-09-28**.

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
