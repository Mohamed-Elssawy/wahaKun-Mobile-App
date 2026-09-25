# Backend requests from the mobile app

Written for the backend teammate. Each item says what the app needs, why, and
what happens today without it. Nothing here is urgent enough to block the app
shipping — the client already handles every failure — but each one costs the
farmer something.

---

## 1. Any request that publishes an event hangs forever (blocking)

**Where:** `AuthService.ForgetPasswordasync`, `AuthService.CreateAccountExpertAsync`,
`UserService.UpdateUserDetailsAsync`

Both services configure MassTransit against RabbitMQ on `localhost:5672`
(`Auth.Service/DependanceInjection/ServiceExtensions.cs`,
`User.Services/DependancyInjection/ServicesExtenions.cs`). With no broker
running, `publish.Publish(...)` blocks and the HTTP request never returns.

**Measured on the dev machine:**

| Request                                          | Result                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| `POST /Auth/ForgetPassword`, email that exists   | no response after 60s                            |
| `POST /Auth/ForgetPassword`, email that does not | 500 in 0.4s (throws before publishing)           |
| `PUT /User/update`                               | no response after 30s — **but the row is saved** |

`UpdateUserDetailsAsync` is the clearest case:

```csharp
await userRepo.UpdateAsync(user);                           // commits
await publish.Publish(new UserUpdatedIntegrationEvent(...)); // never returns
```

**Why it matters.** The app gives up after 15 seconds and shows
"تحقق من اتصالك وحاول مرة أخرى" — check your connection. The farmer's
connection is fine. Worse, for `User/update` the change **did** save, so the
farmer is told it failed, retries, and sees the same error over data that was
already correct. Password reset is fully blocked: the link is never sent.

**What would fix it**, cheapest first:

1. Run RabbitMQ wherever these services run. That alone makes both work.
2. Better: do not make the HTTP response wait on the broker. Publish on a
   background queue, or wrap the publish so a broker failure is logged and the
   request still returns. A profile save should never wait on a message bus, and
   neither should a password-reset request.

Note that publishing _after_ the commit also means the event is lost whenever
the broker is down, even once it stops blocking — worth an outbox if these
events matter.

## 2. A partial `User/update` nulls the address and fails

**Where:** `UserService.UpdateUserDetailsAsync` and
`User.Services/Mapping/UserProfile.cs`

**What happens now.** `PUT /User/update` with a body that does not mention
`Region`/`Village` — say `{ "picture": "..." }` — answers **500**:

```
Cannot insert the value NULL into column 'Region', table 'AuthDb.dbo.Addresses';
column does not allow nulls. UPDATE fails.
```

The mapping rebuilds the whole Address from the request:

```csharp
CreateMap<UserUpdateRequest, AppUser>()
    .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src))
```

so `user.Address` is replaced by a fresh one whose `Region` and `Village` are
null. The guard underneath then reads `userUpdate.Region ?? user.Address.Region`
— but `user.Address` is already the new, null-filled object, so the fallback
falls back to null. `AddressConfig` marks both columns `IsRequired()`, and SQL
rejects the update.

**Why it matters.** Every partial update is impossible, which is the whole point
of a DTO whose fields are all optional. Changing only an avatar, only a name or
only an email cannot succeed.

**What would fix it.** Drop the `ForMember(dest => dest.Address, ...)` line and
let the existing `if (user.Address != null)` block do the work — it already
merges correctly against the _loaded_ entity. One line.

**The app works around it today** by sending the current `region` and `village`
with every update, so nothing is blocked — but the workaround should go once
this is fixed.

---

## 3. `User/update` silently drops the picture, and never returns one

**Where:** `UserService/User.Services/Mapping/UserProfile.cs`

**What happens now.** `PUT /User/update` with a `picture` answers **204**, and the
picture is not saved. `GET /User/details` then always reports `"picture": ""`,
even for an account that has one.

The names do not match, so AutoMapper maps neither direction:

|              |                               |
| ------------ | ----------------------------- |
| entity       | `AppUser.pictures`            |
| request DTO  | `UserUpdateRequest.Picture`   |
| response DTO | `UserDetailsResponse.Picture` |

They differ by the trailing `s`, which case-insensitive matching does not bridge.

**Proved with a control.** One request carrying both `fullName` and `picture`
returned 204; `fullName` persisted and `picture` did not. Nothing else differs
between those two fields except the property name.

**Why it matters.** The farmer cannot set a profile picture at all. Signup no
longer collects one, so this is now the only way to have an avatar — the app
uploads the bytes to MediaStorage fine, and the key is then thrown away.

**What would fix it.** Two lines, next to the `village`/`Region` ones already in
that profile:

```csharp
CreateMap<AppUser, UserDetailsResponse>()
    .ForMember(dest => dest.Picture, opt => opt.MapFrom(src => src.pictures));

CreateMap<UserUpdateRequest, AppUser>()
    .ForMember(dest => dest.pictures, opt => opt.MapFrom(src => src.Picture));
```

---

## 4. Every failure is a 500 with no message

**Where:** `AuthService` — all of it, but password reset is where it hurts most

**What happens now.** `AuthService` throws bare `Exception("User not found")`,
`Exception("Password reset failed")` and so on, and `Program.cs` registers no
exception-handling middleware. ASP.NET turns those into an unhandled **500**
whose body is a developer exception page, not JSON.

The app reads `message`, `title` or `error` out of an error body. A developer
exception page has none of them, so every failure collapses into the same
generic Arabic sentence.

**Why it matters.** The app genuinely cannot tell these apart:

| The farmer did                                 | The server says |
| ---------------------------------------------- | --------------- |
| typed an email that isn't registered           | 500             |
| used a reset link that expired                 | 500             |
| chose a password Identity rejected as too weak | 500             |
| hit a real server fault                        | 500             |

So we cannot say "that email isn't registered", "this link has expired" or
"your password needs a number" — the farmer just gets "try again", retries the
same thing, and gets the same result.

**What would fix it.** Return a **4xx with a JSON body containing `message`**
for the cases the farmer can act on:

```json
{ "message": "لم نعثر على حساب بهذا البريد الإلكتروني" }
```

Suggested: `404` for user-not-found, `400` for an invalid or expired reset
token, `400` with Identity's own errors for a rejected password. Anything
genuinely unexpected can stay a 500; the app already has a fallback for that.

An `app.UseExceptionHandler(...)` that maps exception types to status codes
would cover the whole service in one place.

---

## 5. Store coordinates on the user, not just a region name (not blocking)

**Where:** `AuthService` → `Auth.Domain.Entities.Address`

**What we want.** Two nullable columns, `Latitude` and `Longitude`, on
`Address`, carried through `RegisterRequest` and `UserUpdateRequest`.

**Why.** The app is nationwide and there is no reliable list of Egyptian
villages to pick from, so `Region` and `village` cannot be filled in reliably —
signup no longer asks for them and they are empty for every new account. What a
phone _can_ always produce, offline and everywhere, is a coordinate. If we store
that, the names become something you can resolve later, in bulk, server-side —
and re-run as the data improves. If we don't, the information is simply gone.

**Size.** One migration plus about six files. `Address` is copied into five
services, but only `AuthService` owns migrations for it — `UserService`,
`DashboardService` and `ReportService` all read the same `AuthDb`. Adding a
_nullable_ column breaks none of those readers.

**Until then** the app sends `""` for both, which is required: `AddressConfig`
marks `Region` and `Village` `IsRequired()`, so a null throws on save.

---

## 6. A note, not a request: credentials are committed

`NotificationService/appsettings.json` has a live Gmail address and app
password in it, and `Twilio` account SID and auth token are next to it. They are
in git history, so rotating them means new credentials, not just a new commit.
Worth doing before the repo is shared or made public.
