# P2 server probe

Calls every app-facing endpoint on a running deployment and records the verbatim response.
**It observes and records. It fixes nothing, and it writes nothing to `src/`.**

The output is [`PROBE-2026-10-13.md`](../../PROBE-2026-10-13.md) in the repository root, which
**outranks `BACKEND-INTEGRATION-FACTS.md` on anything on the wire**.

## One command

```
node scripts/probe/run.js --base <url> \
  --farmer-email <e> --farmer-pass <p> \
  --expert-email <e1> --expert-email <e2> --expert-email <e3> --expert-pass <p>
```

Env fallbacks for every flag: `PROBE_BASE`, `PROBE_FARMER_EMAIL`, `PROBE_FARMER_PASS`,
`PROBE_EXPERT_EMAILS` (comma-separated), `PROBE_EXPERT_PASS`.

| Flag                              | Effect                                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `--reads-only`                    | Skips every mutating call. The right way to re-check the read half without creating a second issue. |
| `--render-from <raw.json>`        | Rebuilds the document from a saved log. **Makes no requests at all.**                               |
| `--compare <a.json>,<b.json>`     | Adds a stability verdict per row, and appends rows that only a comparison run carries.              |
| `--photo-critical`, `--photo-low` | Override the two photos. Default to `scripts/demo-photos/`, which is gitignored.                    |
| `--out <path>`                    | Write the document somewhere other than `PROBE-2026-10-13.md`.                                      |

## One caveat on re-running

`findings.js` pulls the counts, the timings, the inbox total and the disposable issue id out of the
run, so those stay correct automatically. But the **verdict prose is hand-written** from the
13 October run, and a few observations are quoted into it literally — the `99.47` confidence, the
expert on `+201010000008`, the zero-byte storage result. A re-run against a changed deployment will
regenerate the document with those sentences unchanged and therefore possibly wrong.

So: re-run freely to check the rows, which are regenerated from the wire every time. **If a row's
result changes, re-read `findings.js` before trusting the verdicts.** The document's own header
carries the run timestamps, which is how to tell the two apart.

## Rules it enforces on itself

- **Nothing is imported from `src/`.** The port table, every path, the two timeouts and
  `resolveAttachmentUrl`'s rewrite rule are copied in with a comment saying so. A probe that shares
  a constant with the code under test cannot catch that constant being wrong.
- **No dependencies.** Node 22+ for `fetch`, `FormData`, `Blob` and `AbortSignal.timeout`.
- **No credential is ever written to disk**, and none appears in the document. Tokens, passwords,
  emails, phone numbers and names are replaced with labelled placeholders. Nothing else about any
  body is altered.
- **The raw JSON log holds live tokens and is written to the OS temp directory**, deliberately
  outside the repository tree. Its path is printed at the end of the run.
- **It degrades.** One endpoint failing never aborts the run. A missing prerequisite produces a row
  saying so, never a silent omission.
- **The disposable-case rule.** The only thing a write probe may ever touch is an issue this probe
  created itself, found by set difference against a baseline taken before `POST /Issue/analyze`. An
  id harvested from the map, the inbox or the feed is read-only, always — `MapResponseDto` carries
  no reporter id, so a map-derived id cannot even have its ownership confirmed. With no disposable
  case, every write row records `UNTESTED — NO DISPOSABLE CASE`.
- **`POST /Farmer/{id}/complete` is called once and never retried.** A second call reports a
  misleading message about an already-closed case.

## The files

| File          | Job                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `run.js`      | Entry point. Parses argv/env, runs the stages in dependency order, writes both artifacts.                     |
| `http.js`     | The one request path, and the L0/L1/L2 classifier.                                                            |
| `jwt.js`      | Reads claim _names_ off a token. Verifies nothing.                                                            |
| `plan.js`     | The copied path table, the document's service grouping, and the one row read from source rather than called.  |
| `matches.js`  | The "matches §4?" verdict per row — a judgement made after the run, kept out of the recorded rows on purpose. |
| `findings.js` | The five verdicts, the error-code vocabulary and every disagreement with the contract file.                   |
| `report.js`   | Renders the markdown.                                                                                         |
