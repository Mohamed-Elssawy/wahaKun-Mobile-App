'use strict';

// A verdict is a judgement made after the run, so it lives here and never in the recorded row.

module.exports = {
  '0a': 'not stated — §4 documents no interstitial behaviour, and there is none to document',
  '0b': 'not stated. Agrees with 0a, so the skip header changes nothing here',

  A1: '**YES** on the route and the body. **NO** on §4.5’s claim names — see the disagreements table',
  A2: '**YES**. Same claim-name disagreement as A1',
  A3: '**YES**. Same claim-name disagreement as A1',
  A4: '**YES**. Same claim-name disagreement as A1',
  A5: '**YES** the route exists, as §4.5 lists it. The failure shape is not stated anywhere',
  A6: 'n/a — not called',
  J2: '**YES** the route exists, as §4.5 lists it. It refuses a valid refresh token with an empty 500',
  I1: 'not stated — §4.5 gives no failure shape. An empty 500, so there is no message to show the user',
  I2: 'not stated. **Byte-identical to I1**, so there is no account enumeration here',

  B1: '**YES** — exactly the seven fields §4.4 lists, no role and no status, and `id` equals the token’s id claim',
  B2: '**YES** — identical shape for an expert. §4.4 confirmed: this body carries no approval state',

  C1: '**YES** on the shape. **NO** twice: §4.3 says `imageUrl` does not exist (it does), and B1 says this route cannot execute (it does)',
  C2: '**YES** — this is §4.3’s INFERENCE, and it holds. The widest of the three shapes',
  C3: '**NO** — §4.3 calls this fallback "equally effective". It returns the fewest rows of the three',
  C4: '**YES** — byte-identical to C1, so the route segment is unbound exactly as §4.3 says',
  C8: '**YES** on the hazard §4.3 predicted — `imageUrl` is a stringified LINQ iterator. **NO** on it throwing: 200, with a real `userName`',
  C10: '**NO** — B5 says this arrives as a bare 500. It is a `404` with a structured code envelope',
  I3: '**YES** — §2 is right that enum binding is permissive; an invalid value is a standard ProblemDetails 400',

  C5: '**YES**, including §3’s mislabelling: `priority:"4"`, `status:"Verified"`, and `Z` on `createdAt`',
  C6: 'not stated — §4 gives no authorisation for `/Map/*`. It is authenticated',
  C7: '**YES** — the single-issue shape matches C5’s row, with the same mislabelling',
  I8: '**YES** — §4 says it answers 500 rather than `[]`, and it does, with no envelope',
  E3: '**YES** — the new issue reaches the map, mislabelled `"Verified"` / `"4"` per §3',

  C9: '**YES** — `{comments, count}` exactly as §4.6 states',
  I9: '**NO**, in the app’s favour — an unknown issue id gives `{comments:[],count:0}`, not an error',

  C11: 'cannot be compared — §4.2 says `KeyNotFoundException`, and the body is empty, so the exception is not observable',
  C12: '**YES** field for field, and §4.2’s behaviour 1 confirmed: a `Repaired` case is still sitting in the inbox',
  C13: '**YES** on the guard. **NO** on B5: a clean `403` from middleware, not a 500',
  I4: '**YES** field for field — names for `type` and `decision`, strings for latitude and longitude, and no `purpose` on either attachment, so G4 stands',
  I5: 'cannot be compared — §4.2 says `UnauthorizedAccessException`; the body is empty. What it does show is that this refusal gets no envelope',
  I6: 'inconclusive — with `totalCount: 1` the `[5, 10]` clamp cannot be observed either way',
  I7: '**YES** — C9 and C10 both confirmed: an empty page is a 200, and `pageCount` is 0',

  D1: '**YES** field for field. **NO** on B2: the service runs',
  D2: '**YES** that the route refuses, but this is the vision service rejecting the photo, **not** §4.1’s below-Medium path, which is still unobserved',

  E1: '**NO** in emphasis — §4.1 is right that creation is asynchronous, but it completed in under a second, not slowly',
  E2C1: '**YES** — the new report appears even under the filtered default, because it is Critical',
  E2C2: '**YES** — one row more than C2, which is the delta this probe created',
  E2C3: '**YES** — one row more, and still the narrowest shape',
  E4: '**YES** on the shape. **NO** on §5: a `Diagnosed` step is written. C12 confirmed: no `Reported` step',
  G2: '**YES** — byte-identical to E4, which is how B4 is shown to be untested rather than disproved',

  F1: 'cannot be compared — empty body, so the refusal cannot be attributed',
  F2: 'cannot be compared — empty body. §4.2’s `Assigned`-only guard is untested',
  F3: 'cannot be compared — empty body. §4.2’s "no status guard" claim is untested',
  F4: 'cannot be compared — empty body. §4.2’s `Scheduled`-only guard is untested',
  G1: '**YES** that it refuses a case which is not `Repaired`, per §4.3. B4 is untested: the guard refused before the mapping ran',
  G3: 'n/a — not reached',

  H0a: '**NO** — the path the client builds is not routed at all',
  H0b: '**NO** — the same 404 with a farmer token, so it is not an authorisation problem',
  H0c: '**NO** — the same 404 with an expert token',
  H0d: 'n/a — this laptop has nothing on port 9000, which is the only thing this row can show',
  H1: '**NO** — `404 page not found` from the ingress, not from ASP.NET',
  H2: '**YES** on the route. **NO** on the content: `200` with `content-length: 0`',
  H3: '**NO** against ARCHITECTURE.md — the URL is now a Kubernetes cluster DNS name, not `127.0.0.1`. And `"size":0`',
  H4: '**NO** — not routed',
  H5: '**YES** — no `[Authorize]`, and a farmer token neither helps nor hurts. Still 0 bytes',
  H6: '**YES** — the same with an expert token. Still 0 bytes',
  H7: 'n/a — the value is a bare key with no host, so `127.0.0.1:9000` had to be supplied to have anything to request',
};
