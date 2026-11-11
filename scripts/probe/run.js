'use strict';

/* eslint-env node */

// Calls every app-facing endpoint on a live deployment and records the response verbatim.

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { request, classify } = require('./http');
const jwt = require('./jwt');
const { PATHS, SOURCE_READ_ROWS, WRITE_MARKER } = require('./plan');
const { render } = require('./report');

// Env first, argv overrides. Nothing is read from or written to disk.

function parseArgs(argv) {
  const out = {
    base: process.env.PROBE_BASE || null,
    farmerEmail: process.env.PROBE_FARMER_EMAIL || null,
    farmerPass: process.env.PROBE_FARMER_PASS || null,
    expertEmails: (process.env.PROBE_EXPERT_EMAILS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    expertPass: process.env.PROBE_EXPERT_PASS || null,
    photoCritical: 'scripts/demo-photos/1-pipe-damage-critical.jpg',
    photoLow: 'scripts/demo-photos/4-overflow-low.jpg',
    out: null,
    readsOnly: false,
    renderFrom: null,
    compare: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const next = () => argv[(i += 1)];
    switch (flag) {
      case '--base':
        out.base = next();
        break;
      case '--farmer-email':
        out.farmerEmail = next();
        break;
      case '--farmer-pass':
        out.farmerPass = next();
        break;
      case '--expert-email':
        out.expertEmails.push(next());
        break;
      case '--expert-pass':
        out.expertPass = next();
        break;
      case '--photo-critical':
        out.photoCritical = next();
        break;
      case '--photo-low':
        out.photoLow = next();
        break;
      case '--out':
        out.out = next();
        break;
      case '--reads-only':
        out.readsOnly = true;
        break;
      case '--render-from':
        out.renderFrom = next();
        break;
      case '--compare':
        out.compare.push(
          ...next()
            .split(',')
            .map(x => x.trim())
            .filter(Boolean),
        );
        break;
      default:
        if (flag.startsWith('--')) {
          console.error(`unknown flag: ${flag}`);
          process.exit(2);
        }
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

// Stable means the same status, layer verdict and key set, since a live list legitimately gains rows.
function keySetOf(body) {
  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      return parsed.length ? `[{${Object.keys(parsed[0]).sort().join(',')}}]` : '[]';
    }
    if (parsed && typeof parsed === 'object')
      return `{${Object.keys(parsed).sort().join(',')}}`;
    return typeof parsed;
  } catch {
    return body ? 'non-JSON' : 'empty';
  }
}

function stabilityOf(primary, others) {
  if (primary.sourceRead) return null;

  const matches = others.map(set => set.find(r => r.id === primary.id)).filter(Boolean);

  // Comparing by id alone once called two rows flapping when the id had changed endpoint.
  const drifted = matches.filter(r => r.endpoint !== primary.endpoint);
  if (drifted.length) {
    return (
      `not comparable - row ${primary.id} names a different endpoint in another run ` +
      `("${primary.endpoint}" against "${drifted[0].endpoint}"), so no stability claim is made`
    );
  }

  // Absence of an observation is not a differing observation, so a skipped row is excluded.
  const skippedElsewhere = matches.filter(r => r.skipped);
  const seen = matches.filter(r => !r.skipped);

  if (!seen.length) {
    if (skippedElsewhere.length) {
      return (
        `single-shot, not re-run - ${skippedElsewhere.length} later pass(es) skipped it: ` +
        `${skippedElsewhere[0].skipped}`
      );
    }
    return `single-shot, not re-run - no comparison run carries row ${primary.id}`;
  }
  const all = [primary, ...seen];
  const statuses = all.map(r => (r.skipped ? r.skipped : r.status));
  const verdicts = all.map(r =>
    r.classification ? r.classification.verdict : r.skipped || '-',
  );
  const keys = all.map(r => (r.skipped ? '-' : keySetOf(r.body)));
  const counts = all.map(r => (r.rowCount == null ? '-' : r.rowCount));
  const same = xs => xs.every(x => String(x) === String(xs[0]));
  const n = all.length;
  if (!same(statuses))
    return `**FLAPPING** across ${n} runs - HTTP ${statuses.join(' then ')}`;
  if (!same(verdicts))
    return `**FLAPPING** across ${n} runs - verdict ${verdicts.join(' then ')}`;
  if (!same(keys))
    return `**FLAPPING** across ${n} runs - key set ${keys.join(' then ')}`;
  const countNote = counts.some(c => c !== '-') ? `; rows ${counts.join(' -> ')}` : '';
  return `stable across ${n} runs (HTTP ${statuses[0]}, same key set${countNote})`;
}

function applyStability(primaryRows, comparePaths) {
  if (!comparePaths.length) return [];
  const others = comparePaths.map(f => {
    const loaded = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), f), 'utf8'));
    return { rows: loaded.rows || [], meta: loaded.meta || {}, file: f };
  });

  for (const row of primaryRows) {
    const verdict = stabilityOf(
      row,
      others.map(o => o.rows),
    );
    if (verdict) row.stability = verdict;
  }

  // A row only in the comparison run is appended with its own startedAt, so provenance is never implied.
  const have = new Set(primaryRows.map(r => r.id));
  for (let i = 0; i < others.length; i += 1) {
    const source = others[i];
    for (const row of source.rows) {
      if (have.has(row.id)) continue;
      have.add(row.id);
      const rest = others.slice(i + 1).map(o => o.rows);
      const verdict = stabilityOf(row, rest);
      primaryRows.push({
        ...row,
        stability:
          verdict ||
          `single-shot, not re-run - only the pass started ${source.meta.runStartedAt} carries row ${row.id}`,
        note: [
          `Added to the probe after the primary run, so it was observed only in the read-only pass started ${source.meta.runStartedAt}. The timestamp on this row is its own.`,
          row.note,
        ]
          .filter(Boolean)
          .join(' '),
      });
    }
  }

  return others.map(o => o.meta.runStartedAt).filter(Boolean);
}

// Re-renders from a saved log without firing a request, so no second issue is created.
if (args.renderFrom) {
  const saved = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), args.renderFrom), 'utf8'),
  );
  const comparedAt = applyStability(saved.rows, args.compare) || [];
  saved.meta.comparisonRuns = comparedAt;
  const findings = require('./findings')({
    facts: saved.facts,
    rows: saved.rows,
    meta: saved.meta,
  });
  const markdown = require('./report').render({
    meta: saved.meta,
    rows: saved.rows,
    ...findings,
  });
  const target = path.resolve(process.cwd(), args.out || 'PROBE-2026-10-13.md');
  fs.writeFileSync(target, markdown, 'utf8');
  console.log(`re-rendered ${target} from ${args.renderFrom} - no requests were made`);
  process.exit(0);
}

if (!args.base || !args.farmerEmail || !args.farmerPass) {
  console.error(
    'Missing required input. A base URL and farmer credentials are mandatory.',
  );
  console.error('');
  console.error('  node scripts/probe/run.js --base <url> \\');
  console.error('    --farmer-email <e> --farmer-pass <p> \\');
  console.error('    [--expert-email <e> ...] [--expert-pass <p>] [--reads-only]');
  console.error('');
  console.error('Env fallbacks: PROBE_BASE, PROBE_FARMER_EMAIL, PROBE_FARMER_PASS,');
  console.error(
    '               PROBE_EXPERT_EMAILS (comma-separated), PROBE_EXPERT_PASS',
  );
  process.exit(2);
}

const BASE = args.base.trim().replace(/\/+$/, '');
const api = p => `${BASE}/api${p}`;

// Exact-value redaction only; a generic pattern would quietly eat parts of a real response.

const secrets = [];

function addSecret(value, label) {
  if (typeof value !== 'string' || value.length < 4) return;
  if (secrets.some(s => s.value === value)) return;
  secrets.push({ value, label });
}

function redact(text) {
  if (!text) return text;
  let out = text;
  // Longest first, so a substring never masks its container.
  for (const { value, label } of [...secrets].sort(
    (a, b) => b.value.length - a.value.length,
  )) {
    if (out.includes(value))
      out = out.split(value).join(`<redacted ${label}, ${value.length} chars>`);
  }
  return out;
}

addSecret(args.farmerPass, 'password');
addSecret(args.expertPass, 'password');
addSecret(args.farmerEmail, 'email: farmer');
args.expertEmails.forEach((e, i) => addSecret(e, `email: expert${i + 1}`));

const rows = [];
const rawLog = [];
const facts = { listCounts: {}, tokens: {}, timings: {}, notes: [] };

function tryParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** One probe. Records the row, prints progress, returns the record and parsed body. */
async function call(meta, spec) {
  const rec = await request(spec);
  const classification = classify(rec);
  rawLog.push({
    id: meta.id,
    meta,
    request: { ...spec, body: undefined, token: spec.token ? '<token>' : null },
    response: rec,
    classification,
  });

  const row = {
    ...meta,
    method: spec.method || 'GET',
    endpoint: meta.endpoint,
    status: rec.status,
    statusText: rec.statusText,
    startedAt: rec.startedAt,
    durationMs: rec.durationMs,
    responseHeaders: rec.responseHeaders,
    sentNgrokSkipHeader: rec.sentNgrokSkipHeader,
    body: rec.transportError ? rec.transportError : redact(rec.body),
    transportError: rec.transportError,
    classification,
  };

  // Streaming endpoints get a descriptor, never the bytes, which would land as mojibake in markdown.
  if (meta.binary && !rec.transportError && rec.body) {
    const ct = rec.responseHeaders['content-type'] || '(none)';
    const len =
      rec.responseHeaders['content-length'] || `${rec.body.length} (read length)`;
    const looksText = /^(application\/json|text\/)/i.test(ct);
    if (!looksText) {
      row.body = `<binary or non-text response withheld: ${len} bytes, content-type ${ct}>`;
      const logged = rawLog[rawLog.length - 1];
      logged.response = { ...logged.response, body: row.body };
    }
  }

  rows.push(row);

  console.log(
    `[${meta.id}] ${row.method} ${meta.endpoint}  ->  ${rec.status == null ? 'NO RESPONSE' : rec.status}` +
      `  ${classification.layer} ${classification.verdict}  ${rec.durationMs}ms`,
  );
  if (rec.transportError) console.log(`      transport: ${rec.transportError}`);

  return { rec, row, json: tryParse(rec.body) };
}

/** A row for something deliberately not called. */
function skip(meta, reason, why) {
  const row = { ...meta, skipped: reason, skippedWhy: why, body: reason, status: null };
  rows.push(row);
  console.log(`[${meta.id}] SKIPPED - ${reason}${why ? ` (${why})` : ''}`);
  return row;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Syntactically valid, deliberately nonexistent. The B1-versus-missing-route probe. */
function randomGuid() {
  const hex = n =>
    [...Array(n)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
}

function jsonBody(obj) {
  return { body: JSON.stringify(obj), headers: { 'content-type': 'application/json' } };
}

/** Issue ids off GetFarmerIssues[] / the community feed / the map, whichever shape arrived. */
function issueIds(parsed) {
  if (!Array.isArray(parsed)) {
    if (parsed && Array.isArray(parsed.results))
      return parsed.results.map(r => r.id).filter(Boolean);
    return [];
  }
  return parsed.map(r => r.issueId || r.IssueId || r.id).filter(Boolean);
}

function rowCountOf(parsed) {
  if (Array.isArray(parsed)) return parsed.length;
  if (parsed && Array.isArray(parsed.results)) return parsed.results.length;
  if (parsed && Array.isArray(parsed.comments)) return parsed.comments.length;
  return null;
}

// Copied from reportService's resolveAttachmentUrl, so the probe never shares the function under test.
const OBJECT_KEY_PREFIX = 'reportimage/';
const NOT_A_KEY = /^([a-z][a-z0-9+.-]*:|\/)/i;
function clientRewrite(url) {
  const keyStart = url.lastIndexOf(OBJECT_KEY_PREFIX);
  if (keyStart !== -1) return api(PATHS.storage(url.slice(keyStart)));
  if (url && !NOT_A_KEY.test(url)) return api(PATHS.storage(url));
  return url;
}

async function multipart(filePath, extraParts) {
  const buf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('Photo', new Blob([buf], { type: 'image/jpeg' }), path.basename(filePath));
  for (const [k, v] of Object.entries(extraParts || {})) form.append(k, v);
  return { form, bytes: buf.length };
}

async function main() {
  const runStartedAt = new Date().toISOString();
  console.log(`\nWAHA KUN P2 server probe - ${runStartedAt}`);
  console.log(`origin: ${BASE}`);
  console.log(
    `mode:   ${args.readsOnly ? 'READS ONLY - every mutating call skipped' : 'full - mutating calls run against a self-created case only'}\n`,
  );

  // Stage 0: the transport itself.
  await call(
    {
      id: '0a',
      group: 'transport',
      endpoint: '{BASE}/api/User/details',
      auth: 'none, NO skip header',
      matches: 'n/a - transport probe',
      unblocks:
        'Whether a device hits the ngrok HTML interstitial. If this returns HTML, every app request needs the skip header and that is a P13 wiring gotcha.',
    },
    { method: 'GET', url: api(PATHS.userDetails), skipNgrokHeader: true },
  );

  await call(
    {
      id: '0b',
      group: 'transport',
      endpoint: '{BASE}/api/User/details',
      auth: 'none, with skip header',
      matches: 'n/a - transport probe',
      unblocks: 'The comparison for 0a. A 401 here means the request reached ASP.NET.',
    },
    { method: 'GET', url: api(PATHS.userDetails) },
  );

  // Stage A: identity.
  const farmer = await call(
    {
      id: 'A1',
      group: 'auth',
      endpoint: '{BASE}/api/Auth/LoginWithEmail',
      auth: 'none (farmer credentials)',
      matches: 'S4.5',
      unblocks:
        'Every farmer-side row below. The token it returns is the only identity the probe has.',
    },
    {
      method: 'POST',
      url: api(PATHS.loginWithEmail),
      ...jsonBody({ Email: args.farmerEmail, Password: args.farmerPass }),
    },
  );

  let farmerToken = null;
  let farmerRefresh = null;
  if (farmer.json) {
    farmerToken = farmer.json.accessToken || null;
    farmerRefresh = farmer.json.refreshToken || null;
    addSecret(farmerToken, 'JWT');
    addSecret(farmerRefresh, 'refresh token');
    if (farmer.json.fulltName) addSecret(farmer.json.fulltName, 'name');
    // Re-redact the login row now that the tokens are known.
    const row = rows.find(r => r.id === 'A1');
    row.body = redact(farmer.rec.body);
  }
  facts.tokens.farmer = farmerToken
    ? jwt.describe(farmerToken)
    : { error: 'no token returned' };

  const expertLogins = [];
  let expertToken = null;
  let expertLabel = null;
  for (let i = 0; i < args.expertEmails.length; i += 1) {
    const email = args.expertEmails[i];
    const label = `expert${i + 1}`;
    const res = await call(
      {
        id: `A${2 + i}`,
        group: 'auth',
        endpoint: '{BASE}/api/Auth/LoginWithEmail',
        auth: `none (${label} credentials)`,
        matches: 'S4.5',
        unblocks: `R4 and R5. One attempt only, per the no-retry rule. ${label}.`,
      },
      {
        method: 'POST',
        url: api(PATHS.loginWithEmail),
        ...jsonBody({ Email: email, Password: args.expertPass }),
      },
    );
    expertLogins.push({ label, res });
    if (res.json && res.json.accessToken) {
      addSecret(res.json.accessToken, 'JWT');
      if (res.json.refreshToken) addSecret(res.json.refreshToken, 'refresh token');
      if (res.json.fulltName) addSecret(res.json.fulltName, 'name');
      rows.find(r => r.id === `A${2 + i}`).body = redact(res.rec.body);
      if (!expertToken) {
        expertToken = res.json.accessToken;
        expertLabel = label;
      }
      facts.tokens[label] = jwt.describe(res.json.accessToken);
    } else {
      facts.tokens[label] = { error: 'no token returned' };
    }
  }
  facts.expertLabelUsed = expertLabel;

  // A bogus but well-formed Firebase ID token. Three base64url segments, junk signature.
  const bogusIdToken = [
    Buffer.from(
      JSON.stringify({ alg: 'RS256', kid: 'probe-not-a-real-key', typ: 'JWT' }),
    ).toString('base64url'),
    Buffer.from(
      JSON.stringify({
        iss: 'https://securetoken.google.com/wahakun-probe',
        aud: 'wahakun-probe',
        sub: 'p2-server-probe',
        iat: 1760000000,
        exp: 1760003600,
      }),
    ).toString('base64url'),
    'this-signature-is-deliberately-invalid',
  ].join('.');

  await call(
    {
      id: 'A5',
      group: 'auth',
      endpoint: '{BASE}/api/Auth/firebase-login',
      auth: 'none (deliberately invalid ID token)',
      matches: 'S4.5 route list',
      unblocks:
        'Step 2 of the demo path. A real Firebase ID token cannot be minted from Node, so this proves only that the route exists, is reachable and what it does with bad input. The real exchange stays UNVERIFIED until P13 on a device.',
    },
    {
      method: 'POST',
      url: api(PATHS.firebaseLogin),
      ...jsonBody({ IdToken: bogusIdToken }),
    },
  );

  for (const sourceRow of SOURCE_READ_ROWS) rows.push(sourceRow);

  // Stage B: identity echo.
  const farmerDetails = farmerToken
    ? await call(
        {
          id: 'B1',
          group: 'user',
          endpoint: '{BASE}/api/User/details',
          auth: 'farmer',
          matches: 'S4.4',
          unblocks:
            'Cross-checks the token id claim against the service own id. P5 profile.',
        },
        {
          method: 'GET',
          url: api(PATHS.userDetails),
          token: farmerToken,
          authLabel: 'farmer',
        },
      )
    : skip(
        {
          id: 'B1',
          group: 'user',
          endpoint: '{BASE}/api/User/details',
          method: 'GET',
          auth: 'farmer',
          matches: '-',
          unblocks: '-',
        },
        'UNTESTED - NO FARMER TOKEN',
        'A1 returned no accessToken.',
      );

  if (farmerDetails && farmerDetails.json) {
    if (farmerDetails.json.fullName) addSecret(farmerDetails.json.fullName, 'name');
    if (farmerDetails.json.phoneNumber)
      addSecret(farmerDetails.json.phoneNumber, 'phone number');
    rows.find(r => r.id === 'B1').body = redact(farmerDetails.rec.body);
    facts.farmerDetailsId = farmerDetails.json.id || null;
  }

  if (expertToken) {
    const d = await call(
      {
        id: 'B2',
        group: 'user',
        endpoint: '{BASE}/api/User/details',
        auth: `${expertLabel}`,
        matches: 'S4.4',
        unblocks:
          'Whether an expert account answers the same shape, and whether it carries any approval state. S4.4 says there is no role and no status field.',
      },
      {
        method: 'GET',
        url: api(PATHS.userDetails),
        token: expertToken,
        authLabel: expertLabel,
      },
    );
    if (d.json) {
      if (d.json.fullName) addSecret(d.json.fullName, 'name');
      if (d.json.phoneNumber) addSecret(d.json.phoneNumber, 'phone number');
      rows.find(r => r.id === 'B2').body = redact(d.rec.body);
    }
  } else {
    skip(
      {
        id: 'B2',
        group: 'user',
        endpoint: '{BASE}/api/User/details',
        method: 'GET',
        auth: 'expert',
        matches: '-',
        unblocks: '-',
      },
      'UNTESTED - NO EXPERT TOKEN',
      'No expert account returned an accessToken.',
    );
  }

  const myId =
    (facts.tokens.farmer && facts.tokens.farmer.userId) ||
    facts.farmerDetailsId ||
    randomGuid();
  facts.myId = myId;
  facts.myIdSource =
    facts.tokens.farmer && facts.tokens.farmer.userId
      ? `token claim ${facts.tokens.farmer.idClaim}`
      : 'GET /User/details';

  // Stage C: baseline reads, before anything is written.
  const listShapes = [
    {
      id: 'C1',
      qs: '',
      label: 'bare',
      unblocks:
        'R1. The call as the app makes it today. S4.3 says the three IssueFilteration defaults hide a farmer own non-critical reports.',
    },
    {
      id: 'C2',
      qs: '?Completed=&Critical=&Assigend=',
      label: 'all three blanked',
      unblocks:
        'R1. S4.3 INFERENCE: an empty query value should bind a nullable enum to null and return everything. Never tested before now.',
    },
    {
      id: 'C3',
      qs: '?Critical=unknown',
      label: 'Critical=unknown',
      unblocks:
        'R1. The S4.3 fallback, run unconditionally: without a third data point a short list and a filtered list look identical.',
    },
  ];

  const baseline = {};
  for (const shape of listShapes) {
    if (!farmerToken) {
      skip(
        {
          id: shape.id,
          group: 'issue-farmer',
          endpoint: `{BASE}/api/Farmer/issues/{myId}${shape.qs}`,
          method: 'GET',
          auth: 'farmer',
          matches: '-',
          unblocks: shape.unblocks,
        },
        'UNTESTED - NO FARMER TOKEN',
        'A1 returned no accessToken.',
      );
      continue;
    }
    const res = await call(
      {
        id: shape.id,
        group: 'issue-farmer',
        endpoint: `{BASE}/api/Farmer/issues/{myId}${shape.qs}`,
        auth: 'farmer',
        matches: 'S4.3',
        unblocks: shape.unblocks,
        note: `Baseline, taken before any write. Query shape: ${shape.label}.`,
      },
      {
        method: 'GET',
        url: api(PATHS.farmerIssues(myId)) + shape.qs,
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    const count = rowCountOf(res.json);
    rows.find(r => r.id === shape.id).rowCount = count;
    baseline[shape.id] = {
      count,
      ids: issueIds(res.json),
      ok: res.rec.status >= 200 && res.rec.status < 300,
    };
    // Keep the widest set seen, for Stage I to pick an id this expert is not assigned to.
    if (
      !facts.farmerListIds ||
      baseline[shape.id].ids.length > facts.farmerListIds.length
    ) {
      facts.farmerListIds = baseline[shape.id].ids;
    }
    facts.listCounts[shape.id] = count;
  }

  if (farmerToken) {
    const strangerId = randomGuid();
    const res = await call(
      {
        id: 'C4',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/issues/{randomGuid}',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks:
          'Proves the route segment is UNBOUND - nothing reads it. It does NOT prove another farmer list can be read: GetAllIssuesByReporterIdAsync takes the id from the token NameIdentifier, so the caller only ever gets their own rows whatever the segment says.',
        note: 'Random, nonexistent guid in the route segment. Compare against C1.',
      },
      {
        method: 'GET',
        url: api(PATHS.farmerIssues(strangerId)),
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    rows.find(r => r.id === 'C4').rowCount = rowCountOf(res.json);
    facts.segmentUnboundSameAsC1 =
      res.rec.body === (rawLog.find(l => l.id === 'C1') || {}).response?.body;
  }

  const mapBaseline = await call(
    {
      id: 'C5',
      group: 'map',
      endpoint: '{BASE}/api/Map/ShowIssueInMap?pageSize=10&page=1',
      auth: farmerToken ? 'farmer' : 'none',
      matches: 'S3, S4',
      unblocks:
        'F-02 map pins, S3 enum mislabelling table, and the unfiltered cross-check count for R1. MapService stringifies stale enums over integers another service wrote.',
      note: 'Baseline, before any write.',
    },
    {
      method: 'GET',
      url: api(PATHS.mapAll(10, 1)),
      token: farmerToken,
      authLabel: farmerToken ? 'farmer' : 'none',
    },
  );
  const mapIds = issueIds(mapBaseline.json);
  rows.find(r => r.id === 'C5').rowCount = rowCountOf(mapBaseline.json);
  facts.mapBaselineCount = rowCountOf(mapBaseline.json);

  await call(
    {
      id: 'C6',
      group: 'map',
      endpoint: '{BASE}/api/Map/ShowIssueInMap?pageSize=10&page=1',
      auth: 'none',
      matches: 'S4',
      unblocks: 'Whether the map needs a token at all. The app always sends one.',
    },
    { method: 'GET', url: api(PATHS.mapAll(10, 1)) },
  );

  const mapProbeId = mapIds[0] || randomGuid();
  await call(
    {
      id: 'C7',
      group: 'map',
      endpoint: '{BASE}/api/Map/SearchForIssueInMap?IssueId={id}',
      auth: farmerToken ? 'farmer' : 'none',
      matches: 'S4',
      unblocks:
        'A second verbatim priority/status pair, and the single-issue map read behind F-02 deep links.',
      note: mapIds[0]
        ? 'Id harvested from C5. Read only - a harvested id is never a write target.'
        : 'No id available from C5; a random guid was used.',
    },
    {
      method: 'GET',
      url: api(PATHS.mapById(mapProbeId)),
      token: farmerToken,
      authLabel: farmerToken ? 'farmer' : 'none',
    },
  );

  if (farmerToken) {
    const res = await call(
      {
        id: 'C8',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/issues',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks:
          'F-01 community feed. Tests C7 (the && to || change) and B3 (the gRPC name lookup) together. S4.3 says DO NOT WIRE.',
      },
      {
        method: 'GET',
        url: api(PATHS.communityFeed),
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    rows.find(r => r.id === 'C8').rowCount = rowCountOf(res.json);
  }

  const commentIssueId = mapIds[0] || randomGuid();
  if (farmerToken) {
    const res = await call(
      {
        id: 'C9',
        group: 'community',
        endpoint:
          '{BASE}/api/Community/GetCommentsByIssueId?issueId={id}&page=1&pageSize=10',
        auth: 'farmer',
        matches: 'S4.6',
        unblocks: 'F-05 comment list. The only REST action on CommunityService.',
        note: mapIds[0]
          ? 'Id harvested from C5, read only.'
          : 'No harvested id; random guid.',
      },
      {
        method: 'GET',
        url: api(PATHS.comments(commentIssueId, 1, 10)),
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    rows.find(r => r.id === 'C9').rowCount = rowCountOf(res.json);
  }

  if (farmerToken) {
    const nonexistent = randomGuid();
    await call(
      {
        id: 'C10',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/{randomGuid}/tracking?issueId={same}',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks:
          'The L1 discriminator. Separates B1 (route exists, activation fails) from a missing route from a missing row - three different conclusions that B5 dresses identically.',
        note: 'Deliberately nonexistent guid.',
      },
      {
        method: 'GET',
        url: `${api(PATHS.tracking(nonexistent))}?issueId=${nonexistent}`,
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
  }

  if (expertToken) {
    const nonexistent = randomGuid();
    await call(
      {
        id: 'C11',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{randomGuid}/review',
        auth: expertLabel,
        matches: 'S4.2',
        unblocks:
          'The same L1 discriminator on the expert side. ExpertController has a registered service, so this should read differently from C10.',
        note: 'Deliberately nonexistent guid.',
      },
      {
        method: 'GET',
        url: api(PATHS.review(nonexistent)),
        token: expertToken,
        authLabel: expertLabel,
      },
    );

    const inbox = await call(
      {
        id: 'C12',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/inbox?PageSize=10&pageIndex=1&SortingOptions=2',
        auth: expertLabel,
        matches: 'S4.2',
        unblocks:
          'R4, and E-01 entirely. B3 points the gRPC client at 5159 while the host listens on 5158, so AutoAssignExpert may never run and the inbox may be structurally empty.',
      },
      {
        method: 'GET',
        url: api(PATHS.inbox(10, 1, 2)),
        token: expertToken,
        authLabel: expertLabel,
      },
    );
    facts.inboxTotalCount =
      inbox.json && typeof inbox.json.totalCount === 'number'
        ? inbox.json.totalCount
        : null;
    facts.inboxStatuses =
      inbox.json && Array.isArray(inbox.json.results)
        ? inbox.json.results.map(r => r.status)
        : [];
    facts.inboxIds =
      inbox.json && Array.isArray(inbox.json.results)
        ? inbox.json.results.map(r => r.id).filter(Boolean)
        : [];
    facts.inboxAssignedExpertIds =
      inbox.json && Array.isArray(inbox.json.results)
        ? inbox.json.results.map(r => r.assignedExpertId)
        : [];
    rows.find(r => r.id === 'C12').rowCount = rowCountOf(inbox.json);
  } else {
    skip(
      {
        id: 'C11',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{randomGuid}/review',
        method: 'GET',
        auth: 'expert',
        matches: '-',
        unblocks: 'L1 discriminator, expert side',
      },
      'UNTESTED - NO APPROVED EXPERT ACCOUNT',
      'No expert credential returned a token.',
    );
    skip(
      {
        id: 'C12',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/inbox?PageSize=10&pageIndex=1&SortingOptions=2',
        method: 'GET',
        auth: 'expert',
        matches: '-',
        unblocks: 'R4',
      },
      'UNTESTED - NO APPROVED EXPERT ACCOUNT',
      'No expert credential returned a token.',
    );
  }

  if (farmerToken) {
    await call(
      {
        id: 'C13',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/inbox?PageSize=10&pageIndex=1&SortingOptions=2',
        auth: 'farmer',
        matches: 'S4.2 Authorize(Roles = Expert)',
        unblocks:
          'What the role guard really returns under B5 - a 403 from middleware, or a 500 wearing an exception.',
      },
      {
        method: 'GET',
        url: api(PATHS.inbox(10, 1, 2)),
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
  }

  // Stage D: create the one disposable case.
  let analyzeCritical = null;
  const analyzeMeta = (id, label, unblocks) => ({
    id,
    group: 'report',
    endpoint: '{BASE}/api/Issue/analyze',
    auth: 'farmer',
    matches: 'S4.1',
    unblocks,
    note: `multipart/form-data - Photo, Latitude, Longitude. Photo: ${label}.`,
  });

  if (args.readsOnly) {
    skip(
      analyzeMeta('D1', 'critical', 'R3'),
      'SKIPPED - --reads-only',
      'Mutating call; the full run owns this row.',
    );
    skip(
      analyzeMeta('D2', 'low', 'R3'),
      'SKIPPED - --reads-only',
      'Mutating call; the full run owns this row.',
    );
  } else if (!farmerToken) {
    skip(
      analyzeMeta('D1', 'critical', 'R3'),
      'UNTESTED - NO FARMER TOKEN',
      'A1 returned no accessToken.',
    );
    skip(
      analyzeMeta('D2', 'low', 'R3'),
      'UNTESTED - NO FARMER TOKEN',
      'A1 returned no accessToken.',
    );
  } else {
    for (const [id, file, label, unblocks] of [
      [
        'D1',
        args.photoCritical,
        'critical',
        'R3, and the whole write half of this probe: the issue this call creates is the ONLY legal write target. S4.1 maps a critical severity to Critical, which is at or above Medium, so an issue should be enqueued.',
      ],
      [
        'D2',
        args.photoLow,
        'low',
        'R3. S4.1 maps a low severity below Medium and then creates NO issue at all. The local report mirror and its disjoint-sets invariant are built on that behaviour and it has never once been observed.',
      ],
    ]) {
      const abs = path.resolve(process.cwd(), file);
      if (!fs.existsSync(abs)) {
        skip(
          analyzeMeta(id, label, unblocks),
          'SKIPPED - PHOTO NOT FOUND',
          `Expected at ${file}.`,
        );
        continue;
      }
      const { form, bytes } = await multipart(abs, {
        Latitude: '30.0444',
        Longitude: '31.2357',
      });
      const res = await call(
        { ...analyzeMeta(id, `${label}, ${bytes} bytes`, unblocks) },
        {
          method: 'POST',
          url: api(PATHS.analyze),
          token: farmerToken,
          authLabel: 'farmer',
          body: form,
          upload: true,
        },
      );
      if (id === 'D1') analyzeCritical = res;
      facts[`analyze_${id}`] = { status: res.rec.status, layer: classify(res.rec).layer };
    }
  }

  // Stage E: the delta, and the disposable id.
  const pollShape =
    baseline.C2 && baseline.C2.ok
      ? 'C2'
      : baseline.C1 && baseline.C1.ok
        ? 'C1'
        : baseline.C3 && baseline.C3.ok
          ? 'C3'
          : null;
  let disposableId = null;

  if (!args.readsOnly && farmerToken && pollShape) {
    const qs = listShapes.find(s => s.id === pollShape).qs;
    const before = new Set(baseline[pollShape].ids);
    const pollStart = Date.now();
    let polls = 0;
    let appeared = null;
    while (Date.now() - pollStart < 45000) {
      polls += 1;
      const rec = await request({
        method: 'GET',
        url: api(PATHS.farmerIssues(myId)) + qs,
        token: farmerToken,
      });
      rawLog.push({
        id: `E-poll-${polls}`,
        response: rec,
        classification: classify(rec),
      });
      const fresh = issueIds(tryParse(rec.body)).filter(x => !before.has(x));
      if (fresh.length) {
        appeared = fresh[0];
        break;
      }
      await sleep(3000);
    }
    facts.pollCount = polls;
    facts.pollElapsedMs = Date.now() - pollStart;
    disposableId = appeared;

    rows.push({
      id: 'E1',
      group: 'issue-farmer',
      method: 'GET',
      endpoint: `{BASE}/api/Farmer/issues/{myId}${qs} (polled)`,
      auth: 'farmer',
      status: null,
      startedAt: new Date(pollStart).toISOString(),
      durationMs: Date.now() - pollStart,
      responseHeaders: {},
      classification: {
        layer: appeared ? 'L2' : 'L1',
        verdict: appeared ? 'NEW ISSUE APPEARED' : 'NO ISSUE APPEARED WITHIN 45 S',
        detail: `${polls} poll${polls === 1 ? '' : 's'}, 3 s apart`,
      },
      body: appeared
        ? `New issue id appeared after ${facts.pollElapsedMs} ms and ${polls} poll${polls === 1 ? '' : 's'}. Set difference against the ${pollShape} baseline.`
        : `No new issue id appeared within 45 s (${polls} poll${polls === 1 ? '' : 's'}). Distinct from D1 failing: see D1 for whether analyze answered at all.`,
      matches:
        'S4.1 - creation is asynchronous via Hangfire and the new id is not in the analyze response',
      unblocks: 'The disposable case. Every write row below depends on this one.',
      note: 'Every individual poll is timestamped in the raw JSON log; this row is their summary.',
      rowCount: null,
    });

    for (const shape of listShapes) {
      if (!baseline[shape.id]) continue;
      const res = await call(
        {
          id: `E2${shape.id}`,
          group: 'issue-farmer',
          endpoint: `{BASE}/api/Farmer/issues/{myId}${shape.qs}`,
          auth: 'farmer',
          matches: 'S4.3',
          unblocks: `R1 after-count for the ${shape.label} shape. The delta against ${shape.id} is the finding: does a new report appear in the farmer own list at all.`,
          note: `After D1. Baseline was ${shape.id} with ${baseline[shape.id].count} rows.`,
        },
        {
          method: 'GET',
          url: api(PATHS.farmerIssues(myId)) + shape.qs,
          token: farmerToken,
          authLabel: 'farmer',
        },
      );
      rows.find(r => r.id === `E2${shape.id}`).rowCount = rowCountOf(res.json);
      facts.listCounts[`after_${shape.id}`] = rowCountOf(res.json);
    }

    const mapAfter = await call(
      {
        id: 'E3',
        group: 'map',
        endpoint: '{BASE}/api/Map/ShowIssueInMap?pageSize=10&page=1',
        auth: 'farmer',
        matches: 'S3, S4',
        unblocks: 'Whether a newly created issue reaches the map. Baseline is C5.',
        note: `After D1. Baseline C5 had ${facts.mapBaselineCount} rows.`,
      },
      {
        method: 'GET',
        url: api(PATHS.mapAll(10, 1)),
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    rows.find(r => r.id === 'E3').rowCount = rowCountOf(mapAfter.json);
    facts.mapAfterCount = rowCountOf(mapAfter.json);
  } else if (!pollShape && !args.readsOnly) {
    rows.push({
      id: 'E1',
      group: 'issue-farmer',
      method: 'GET',
      endpoint: '{BASE}/api/Farmer/issues/{myId} (polled)',
      auth: 'farmer',
      skipped: 'UNTESTED - NO OWNERSHIP-CONFIRMABLE ID',
      skippedWhy:
        'No list shape answered 2xx, so a new issue cannot be identified as the caller own. MapResponseDto carries no reporter id, so a map set-difference cannot confirm ownership either, and a harvested id is never a write target.',
      body: 'UNTESTED - NO OWNERSHIP-CONFIRMABLE ID',
      status: null,
      matches: '-',
      unblocks: 'The disposable case.',
    });
  }

  facts.disposableId = disposableId;
  if (disposableId) console.log(`\n  disposable case: ${disposableId}\n`);
  else console.log('\n  no disposable case - every write probe will record UNTESTED\n');

  // Tracking on the disposable id - R2.
  if (disposableId) {
    const res = await call(
      {
        id: 'E4',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/{newId}/tracking?issueId={same}',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks:
          'R2 and defect D4. Whether currentStatus, steps[].status and steps[].state arrive as NAMES or INTEGERS, and whether a Reported step exists at all (C12 says the creation job no longer writes one).',
        note: 'On the probe own freshly created case, so the input is known.',
      },
      {
        method: 'GET',
        url: `${api(PATHS.tracking(disposableId))}?issueId=${disposableId}`,
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    facts.tracking = res.json;
  } else {
    skip(
      {
        id: 'E4',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/{newId}/tracking?issueId={same}',
        method: 'GET',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks: 'R2',
      },
      args.readsOnly ? 'SKIPPED - --reads-only' : 'UNTESTED - NO DISPOSABLE CASE',
      'See E1. A harvested id is never used here: this row is about the probe own case.',
    );
  }

  // Stage F: the expert writes, disposable id only.
  const writeGate = (id, group, endpoint, method, unblocks) => {
    if (args.readsOnly)
      return skip(
        { id, group, endpoint, method, auth: 'expert', matches: 'S4.2', unblocks },
        'SKIPPED - --reads-only',
        'Mutating call.',
      );
    if (!disposableId)
      return skip(
        { id, group, endpoint, method, auth: 'expert', matches: 'S4.2', unblocks },
        'UNTESTED - NO DISPOSABLE CASE',
        'No issue was created by this probe, so there is nothing it may legally write to. A case harvested from the map or the inbox is never a write target.',
      );
    if (!expertToken)
      return skip(
        { id, group, endpoint, method, auth: 'expert', matches: 'S4.2', unblocks },
        'UNTESTED - NO APPROVED EXPERT ACCOUNT',
        'No expert credential returned a usable token.',
      );
    return null;
  };

  const fReview = writeGate(
    'F1',
    'issue-expert',
    '{BASE}/api/Expert/{newId}/review',
    'GET',
    'E-02 case review. Read first: the expert is not assigned to this case, so the refusal itself is evidence the route activates.',
  );
  if (!fReview) {
    await call(
      {
        id: 'F1',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{newId}/review',
        auth: expertLabel,
        matches: 'S4.2',
        unblocks: 'E-02 case review.',
        note: 'The probe own case.',
      },
      {
        method: 'GET',
        url: api(PATHS.review(disposableId)),
        token: expertToken,
        authLabel: expertLabel,
      },
    );
  }

  const fSubmit = writeGate(
    'F2',
    'issue-expert',
    '{BASE}/api/Expert/{newId}/review',
    'POST',
    'R5. E-02 submit. S4.2 says it refuses unless the status is exactly Assigned.',
  );
  if (!fSubmit) {
    await call(
      {
        id: 'F2',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{newId}/review',
        auth: expertLabel,
        matches: 'S4.2',
        unblocks: 'R5. Refuses unless status is exactly Assigned.',
        note: 'The probe own case.',
      },
      {
        method: 'POST',
        url: api(PATHS.review(disposableId)),
        token: expertToken,
        authLabel: expertLabel,
        ...jsonBody({ decision: 0, notes: WRITE_MARKER }),
      },
    );
  }

  const fSchedule = writeGate(
    'F3',
    'issue-expert',
    '{BASE}/api/Expert/{newId}/schedule',
    'POST',
    'R5. E-03. S4.2 says there is NO status guard on this one.',
  );
  if (!fSchedule) {
    const d = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    await call(
      {
        id: 'F3',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{newId}/schedule',
        auth: expertLabel,
        matches: 'S4.2',
        unblocks: 'R5. E-03 scheduling. No status guard per S4.2.',
        note: 'The probe own case.',
      },
      {
        method: 'POST',
        url: api(PATHS.schedule(disposableId)),
        token: expertToken,
        authLabel: expertLabel,
        ...jsonBody({
          scheduledDate: d,
          slotStart: '09:00:00',
          slotEnd: '11:00:00',
          farmerNotified: true,
          notes: WRITE_MARKER,
        }),
      },
    );
  }

  const fResolution = writeGate(
    'F4',
    'issue-expert',
    '{BASE}/api/Expert/{newId}/resolution',
    'POST',
    'R5. E-05. S4.2 says it refuses unless the status is exactly Scheduled.',
  );
  if (!fResolution) {
    const abs = path.resolve(process.cwd(), args.photoLow);
    if (!fs.existsSync(abs)) {
      skip(
        {
          id: 'F4',
          group: 'issue-expert',
          endpoint: '{BASE}/api/Expert/{newId}/resolution',
          method: 'POST',
          auth: expertLabel,
          matches: 'S4.2',
          unblocks: 'R5',
        },
        'SKIPPED - PHOTO NOT FOUND',
        `Expected at ${args.photoLow}.`,
      );
    } else {
      const { form } = await multipart(abs, { Notes: WRITE_MARKER });
      await call(
        {
          id: 'F4',
          group: 'issue-expert',
          endpoint: '{BASE}/api/Expert/{newId}/resolution',
          auth: expertLabel,
          matches: 'S4.2',
          unblocks: 'R5. E-05 resolution. multipart - Photo, Notes.',
          note: 'The probe own case.',
        },
        {
          method: 'POST',
          url: api(PATHS.resolution(disposableId)),
          token: expertToken,
          authLabel: expertLabel,
          body: form,
          upload: true,
        },
      );
    }
  }

  // Stage G: the farmer writes, same id only.
  let statusBeforeComplete = null;
  if (disposableId && farmerToken && !args.readsOnly) {
    const probe = await request({
      method: 'GET',
      url: `${api(PATHS.tracking(disposableId))}?issueId=${disposableId}`,
      token: farmerToken,
    });
    rawLog.push({ id: 'G0-internal', response: probe, classification: classify(probe) });
    const parsed = tryParse(probe.body);
    statusBeforeComplete =
      parsed && parsed.currentStatus != null ? parsed.currentStatus : null;
    facts.statusBeforeComplete = statusBeforeComplete;
  }

  if (args.readsOnly) {
    skip(
      {
        id: 'G1',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/{newId}/complete',
        method: 'POST',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks: 'F-06 node 6',
      },
      'SKIPPED - --reads-only',
      'Mutating call, and single-shot: B4 makes a second call report a misleading message about an already-closed case.',
    );
  } else if (!disposableId) {
    skip(
      {
        id: 'G1',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/{newId}/complete',
        method: 'POST',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks: 'F-06 node 6, confirmResolution',
      },
      'UNTESTED - NO DISPOSABLE CASE',
      'See E1.',
    );
  } else {
    await call(
      {
        id: 'G1',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/{newId}/complete',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks:
          'F-06 node 6, confirmResolution. B4 says the write commits and THEN the response mapping throws.',
        note: `Called ONCE. No retry: a second call hits the Repaired-only guard and reports a misleading message about an already-closed case. Status before the call: ${statusBeforeComplete == null ? 'unknown' : statusBeforeComplete}.`,
      },
      {
        method: 'POST',
        url: api(PATHS.complete(disposableId)),
        token: farmerToken,
        authLabel: 'farmer',
      },
    );

    const after = await call(
      {
        id: 'G2',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/{newId}/tracking?issueId={same}',
        auth: 'farmer',
        matches: 'S4.3',
        unblocks:
          'Proves or disproves B4 WITHOUT retrying complete: if the status moved although G1 errored, the write committed and only the response failed.',
        note: `Status before G1 was ${statusBeforeComplete == null ? 'unknown' : statusBeforeComplete}.`,
      },
      {
        method: 'GET',
        url: `${api(PATHS.tracking(disposableId))}?issueId=${disposableId}`,
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    facts.statusAfterComplete =
      after.json && after.json.currentStatus != null ? after.json.currentStatus : null;

    const reached =
      facts.statusAfterComplete === 'Repaired' || statusBeforeComplete === 'Repaired';
    if (reached) {
      await call(
        {
          id: 'G3',
          group: 'issue-farmer',
          endpoint: '{BASE}/api/Farmer/{newId}/uncomplete',
          auth: 'farmer',
          matches: 'S4.3',
          unblocks:
            'rejectResolution. S4.3: the guard tests Repaired although the message says completed, and it DELETES every Repaired and completed StatusHistory row.',
          note: 'Only run because the case reached Repaired.',
        },
        {
          method: 'POST',
          url: api(PATHS.uncomplete(disposableId)),
          token: farmerToken,
          authLabel: 'farmer',
        },
      );
      await call(
        {
          id: 'G4',
          group: 'issue-farmer',
          endpoint: '{BASE}/api/Farmer/{newId}/tracking?issueId={same}',
          auth: 'farmer',
          matches: 'S4.3',
          unblocks:
            'Whether uncomplete really deletes the Repaired and completed history rows - the destructive behaviour in S4.3.',
        },
        {
          method: 'GET',
          url: `${api(PATHS.tracking(disposableId))}?issueId=${disposableId}`,
          token: farmerToken,
          authLabel: 'farmer',
        },
      );
    } else {
      skip(
        {
          id: 'G3',
          group: 'issue-farmer',
          endpoint: '{BASE}/api/Farmer/{newId}/uncomplete',
          method: 'POST',
          auth: 'farmer',
          matches: 'S4.3',
          unblocks: 'rejectResolution',
        },
        'UNTESTED - CASE NEVER REACHED Repaired',
        `The guard accepts only Repaired. Status observed: ${facts.statusAfterComplete == null ? 'unknown' : facts.statusAfterComplete}.`,
      );
    }
  }

  // Stage H: storage, the late re-check, and the refresh.
  const storageCandidates = [];
  if (analyzeCritical && analyzeCritical.json && analyzeCritical.json.filePath)
    storageCandidates.push({
      value: analyzeCritical.json.filePath,
      from: 'D1 analyze filePath',
    });
  if (mapBaseline.json) {
    const withPhoto = (Array.isArray(mapBaseline.json) ? mapBaseline.json : []).find(
      r => r.photoUrl,
    );
    if (withPhoto)
      storageCandidates.push({ value: withPhoto.photoUrl, from: 'C5 map photoUrl' });
  }

  if (!storageCandidates.length) {
    skip(
      {
        id: 'H1',
        group: 'media',
        endpoint: '{BASE}/api/storage?objectName={key}',
        method: 'GET',
        auth: 'none / farmer / expert',
        matches: 'ARCHITECTURE.md',
        unblocks: 'Every <Image> in the app',
      },
      'SKIPPED - NO OBJECT NAME OBSERVED',
      'No response carried a filePath, photoUrl or attachment url to probe with.',
    );
  } else {
    const candidate = storageCandidates[0];
    const key = candidate.value;
    const encoded = encodeURIComponent(key);

    // The service matches case-insensitively, but a path-prefix proxy need not, so four forms are separated.
    const forms = [
      [
        'H1',
        clientRewrite(key),
        '{BASE}/api/storage?objectName={key} - exactly what the client builds',
        'THE question behind every photo in the app. resolveAttachmentUrl produces this form; twelve <Image source={{uri}}> call sites would request it.',
      ],
      [
        'H2',
        `${BASE}/api/Storage?objectName=${encoded}`,
        '{BASE}/api/Storage?objectName={key} - capital S, the route as StorageController declares it',
        'Whether the 404 on H1 is case-sensitive routing in front of the service rather than a missing route.',
      ],
      [
        'H3',
        `${BASE}/api/Storage/get?objectName=${encoded}`,
        '{BASE}/api/Storage/get?objectName={key} - the other GET on the controller',
        'GetFile rather than DownloadFile. Returns a value rather than a stream.',
      ],
      [
        'H4',
        `${BASE}/storage?objectName=${encoded}`,
        '{BASE}/storage?objectName={key} - no /api prefix',
        'Whether the prefix is what is wrong.',
      ],
    ];

    let servingForm = null;
    for (const [id, url, endpoint, unblocks] of forms) {
      const res = await call(
        {
          id,
          group: 'media',
          endpoint,
          auth: 'none',
          matches: 'S4 has no MediaStorage section; route read from StorageController',
          unblocks,
          note: `Object key from ${candidate.from}: the bare key arrives as issues/<file>, and resolveAttachmentUrl second branch handles a bare key, so the client is building its URL correctly.`,
          binary: true,
        },
        { method: 'GET', url },
      );
      if (!servingForm && res.rec.status >= 200 && res.rec.status < 300)
        servingForm = { id, url, endpoint };
    }

    // The auth matrix only means anything against a form that actually serves.
    const matrix = [
      ['H5', farmerToken, 'farmer'],
      ['H6', expertToken, expertLabel || 'expert'],
    ];
    for (const [id, token, label] of matrix) {
      const meta = {
        id,
        group: 'media',
        endpoint: servingForm
          ? `${servingForm.endpoint} (with a token)`
          : 'the serving storage form, with a token',
        method: 'GET',
        auth: label,
        matches:
          'StorageController carries no [Authorize] on the controller or on any action',
        unblocks:
          'Whether storage needs a bearer token. React Native <Image source={{uri}}> sends no Authorization header, so if it does, every photo and every avatar in the app 401s silently and the only client-side alternative is fetching bytes through apiClient and rendering a blob.',
        binary: true,
      };
      if (!servingForm) {
        skip(
          meta,
          'UNTESTED - NO STORAGE FORM SERVED',
          'None of H1 to H4 returned 2xx, so there is nothing to test a token against. The anonymous result already decides the question for the app.',
        );
        continue;
      }
      if (!token) {
        skip(meta, 'UNTESTED - NO TOKEN', `No ${label} token available.`);
        continue;
      }
      await call(meta, { method: 'GET', url: servingForm.url, token, authLabel: label });
    }

    await call(
      {
        id: 'H7',
        group: 'media',
        endpoint: 'the server own returned value, verbatim',
        auth: 'none',
        matches: 'ARCHITECTURE.md',
        unblocks:
          'Nothing on its own. Recorded honestly: when the server returns a 127.0.0.1:9000 URL, probing it FROM THIS LAPTOP tests this machine port 9000, not the server. It establishes only that such a URL is unusable anywhere but the server host.',
        note: `Verbatim value from ${candidate.from}: ${key.startsWith('http') ? 'a URL' : 'a bare object key, so there is no host in it at all and 127.0.0.1:9000 had to be supplied by this probe to have something to request'}.`,
        binary: true,
      },
      {
        method: 'GET',
        url: key.startsWith('http') ? key : `http://127.0.0.1:9000/${key}`,
      },
    );
  }

  // Stage I: the error-code vocabulary. Reads and failing auth only, so nothing mutates.
  const inboxIds = new Set(facts.inboxIds || []);
  const assignedToMe = (facts.inboxIds || [])[0] || null;
  const notAssignedToMe = (facts.farmerListIds || []).find(x => !inboxIds.has(x)) || null;

  await call(
    {
      id: 'I1',
      group: 'auth',
      endpoint: '{BASE}/api/Auth/LoginWithEmail',
      auth: 'none (correct email, wrong password)',
      matches: 'S4.5 does not state the failure shape',
      unblocks:
        'The login error path in P13. AuthService throws a plain Exception("invalid email or password"), so this shows what a non-domain exception looks like through the new middleware.',
      note: 'A failed login mutates nothing.',
    },
    {
      method: 'POST',
      url: api(PATHS.loginWithEmail),
      ...jsonBody({
        Email: args.farmerEmail,
        Password: 'definitely-not-the-password-p2-probe',
      }),
    },
  );

  await call(
    {
      id: 'I2',
      group: 'auth',
      endpoint: '{BASE}/api/Auth/LoginWithEmail',
      auth: 'none (unknown email)',
      matches: 'S4.5 does not state the failure shape',
      unblocks:
        'Whether an unknown account is distinguishable from a wrong password. If it is, that is an account-enumeration note for the ask.',
    },
    {
      method: 'POST',
      url: api(PATHS.loginWithEmail),
      ...jsonBody({
        Email: 'no-such-account-p2-probe@example.invalid',
        Password: 'definitely-not-the-password-p2-probe',
      }),
    },
  );

  if (farmerToken) {
    await call(
      {
        id: 'I3',
        group: 'issue-farmer',
        endpoint: '{BASE}/api/Farmer/issues/{myId}?Critical=notanenum',
        auth: 'farmer',
        matches: 'S2 says query-string enum binding accepts a name or a number',
        unblocks:
          'Whether [ApiController] automatic 400 is in play and what shape it has. A model-binding failure is a different error family from a domain refusal and the client has to tell them apart.',
      },
      {
        method: 'GET',
        url: `${api(PATHS.farmerIssues(myId))}?Critical=notanenum`,
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
  }

  if (expertToken && assignedToMe) {
    await call(
      {
        id: 'I4',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{assignedToMe}/review',
        auth: expertLabel,
        matches: 'S4.2 CaseReviewResponse',
        unblocks:
          'E-02 entirely. The only observation of the full CaseReviewResponse shape - attachments[].type, expertReviews[].decision, latitude/longitude as strings, aiAnalysis.confidence.',
        note: 'Read only, on a case harvested from this expert own inbox. A harvested id is never a write target.',
      },
      {
        method: 'GET',
        url: api(PATHS.review(assignedToMe)),
        token: expertToken,
        authLabel: expertLabel,
      },
    );
  } else {
    skip(
      {
        id: 'I4',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{assignedToMe}/review',
        method: 'GET',
        auth: 'expert',
        matches: 'S4.2',
        unblocks: 'E-02 CaseReviewResponse shape',
      },
      'UNTESTED - NO CASE ASSIGNED TO A CREDENTIALLED EXPERT',
      'The inbox carried no row to read.',
    );
  }

  if (expertToken && notAssignedToMe) {
    await call(
      {
        id: 'I5',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{notAssignedToMe}/review',
        auth: expertLabel,
        matches:
          'S4.2 throws UnauthorizedAccessException when the caller is not the assigned expert',
        unblocks:
          'Which exception types the new middleware wraps. KeyNotFoundException gets an envelope (C10); this one isolates UnauthorizedAccessException on a real, existing issue. It decides whether isServerRefusal can be retired.',
        note: 'Read only, on a real issue this expert is not assigned to.',
      },
      {
        method: 'GET',
        url: api(PATHS.review(notAssignedToMe)),
        token: expertToken,
        authLabel: expertLabel,
      },
    );
  } else {
    skip(
      {
        id: 'I5',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/{notAssignedToMe}/review',
        method: 'GET',
        auth: 'expert',
        matches: 'S4.2',
        unblocks: 'Isolates UnauthorizedAccessException',
      },
      'UNTESTED - NO SUITABLE ID',
      'No existing issue was available that this expert is not assigned to.',
    );
  }

  if (expertToken) {
    await call(
      {
        id: 'I6',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/inbox?PageSize=999&pageIndex=1&SortingOptions=2',
        auth: expertLabel,
        matches: 'S4.2 says PageSize is clamped server-side to [5, 10]',
        unblocks:
          'Confirms the clamp. If 999 is honoured instead, the inbox pager in E-01 can ask for more than ten.',
      },
      {
        method: 'GET',
        url: api(PATHS.inbox(999, 1, 2)),
        token: expertToken,
        authLabel: expertLabel,
      },
    );
    await call(
      {
        id: 'I7',
        group: 'issue-expert',
        endpoint: '{BASE}/api/Expert/inbox?PageSize=10&pageIndex=99&SortingOptions=2',
        auth: expertLabel,
        matches:
          'S4.2 C9 says an empty inbox is a 200 with an empty page, not an exception',
        unblocks:
          'The empty-page shape, and whether pageCount is ceil(onThisPage / PageSize) as C10 says.',
      },
      {
        method: 'GET',
        url: api(PATHS.inbox(10, 99, 2)),
        token: expertToken,
        authLabel: expertLabel,
      },
    );
  }

  if (farmerToken) {
    const unknown = randomGuid();
    await call(
      {
        id: 'I8',
        group: 'map',
        endpoint: '{BASE}/api/Map/SearchForIssueInMap?IssueId={randomGuid}',
        auth: 'farmer',
        matches: 'S4 notes it answers 500 rather than [] when nothing matches',
        unblocks: 'The map not-found shape, and another error code for the vocabulary.',
      },
      {
        method: 'GET',
        url: api(PATHS.mapById(unknown)),
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    await call(
      {
        id: 'I9',
        group: 'community',
        endpoint:
          '{BASE}/api/Community/GetCommentsByIssueId?issueId={randomGuid}&page=1&pageSize=10',
        auth: 'farmer',
        matches: 'S4.6',
        unblocks:
          'Whether an unknown issue id is an empty list or an error on CommunityService.',
      },
      {
        method: 'GET',
        url: api(PATHS.comments(unknown, 1, 10)),
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
  }

  // The late re-check: a cold Hangfire worker is a different finding from a job that never runs.
  if (!args.readsOnly && farmerToken && pollShape && !disposableId) {
    const qs = listShapes.find(s => s.id === pollShape).qs;
    const res = await call(
      {
        id: 'J1',
        group: 'issue-farmer',
        endpoint: `{BASE}/api/Farmer/issues/{myId}${qs}`,
        auth: 'farmer',
        matches: 'S4.1',
        unblocks:
          'Separates a cold Hangfire worker that takes minutes from a job that never runs at all. If the issue appears here, every write row still reads UNTESTED - NO DISPOSABLE CASE AT THE TIME, and this late arrival is the finding.',
        note: `Late re-check, ${Math.round((Date.now() - new Date(runStartedAt).getTime()) / 1000)} s into the run. Baseline ${pollShape} had ${baseline[pollShape].count} rows.`,
      },
      {
        method: 'GET',
        url: api(PATHS.farmerIssues(myId)) + qs,
        token: farmerToken,
        authLabel: 'farmer',
      },
    );
    const late = issueIds(res.json).filter(x => !new Set(baseline[pollShape].ids).has(x));
    rows.find(r => r.id === 'J1').rowCount = rowCountOf(res.json);
    facts.lateArrival = late.length ? late[0] : null;
  }

  if (farmerRefresh) {
    const res = await call(
      {
        id: 'J2',
        group: 'auth',
        endpoint: '{BASE}/api/Auth/Refresh-Token',
        auth: 'none (farmer refresh token in the body)',
        matches: 'S4.5',
        unblocks:
          'Session continuity. Run last so a broken refresh cannot disturb the rest of the session.',
      },
      {
        method: 'POST',
        url: api(PATHS.refreshToken),
        ...jsonBody({ RefreshToken: farmerRefresh }),
      },
    );
    if (res.json && res.json.accessToken) {
      addSecret(res.json.accessToken, 'JWT');
      if (res.json.refreshToken) addSecret(res.json.refreshToken, 'refresh token');
      rows.find(r => r.id === 'J2').body = redact(res.rec.body);
      facts.tokens.refreshed = jwt.describe(res.json.accessToken);
    }
  } else {
    skip(
      {
        id: 'J2',
        group: 'auth',
        endpoint: '{BASE}/api/Auth/Refresh-Token',
        method: 'POST',
        auth: 'none',
        matches: 'S4.5',
        unblocks: 'Session continuity',
      },
      'UNTESTED - NO REFRESH TOKEN',
      'A1 returned no refreshToken.',
    );
  }

  // Write the artifacts.
  const runFinishedAt = new Date().toISOString();

  let branch = 'unknown';
  let commit = 'unknown';
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    /* not fatal */
  }

  const meta = {
    dateLong: '13 October 2026',
    runStartedAt,
    runFinishedAt,
    base: BASE,
    shape:
      'gateway - every service behind one origin at /api, as API_MODE gateway builds it in src/config/env.ts',
    branch,
    commit,
    node: process.version,
    callCount: rawLog.length,
    probeCommand:
      'node scripts/probe/run.js --base <url> --farmer-email <e> --farmer-pass <p> ' +
      '--expert-email <e1> --expert-email <e2> --expert-email <e3> --expert-pass <p>' +
      (args.readsOnly ? ' --reads-only' : ''),
  };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wahakun-probe-'));
  const rawPath = path.join(
    tmpDir,
    `probe-raw-${runStartedAt.replace(/[:.]/g, '-')}.json`,
  );
  // rawLog holds unredacted bodies with live tokens, so both files stay outside the repository tree.
  fs.writeFileSync(
    rawPath,
    JSON.stringify({ meta, facts, rows, rawLog }, null, 2),
    'utf8',
  );

  meta.comparisonRuns = applyStability(rows, args.compare) || [];

  let findings;
  try {
    findings = require('./findings')({ facts, rows, meta });
  } catch (error) {
    findings = {
      verdicts: ['R1', 'R2', 'R3', 'R4', 'R5'].map(id => ({
        id,
        title: 'not yet written',
        verdict: 'PENDING',
        text: `scripts/probe/findings.js did not load: ${error.message}`,
        evidence: [],
      })),
      disagreements: [],
      sections: { preamble: [], closing: [] },
    };
  }

  const markdown = render({ meta, rows, ...findings });
  const outPath = path.resolve(process.cwd(), args.out || 'PROBE-2026-10-13.md');
  fs.writeFileSync(outPath, markdown, 'utf8');

  console.log(`\n${rawLog.length} calls.`);
  console.log(`document:    ${outPath}`);
  console.log(`raw log:     ${rawPath}`);
  console.log('             ^ outside the repository tree, and it holds live tokens.\n');
}

main().catch(error => {
  console.error(
    '\nThe probe itself failed, which is a bug in the probe and not a finding:',
  );
  console.error(error);
  process.exit(1);
});
