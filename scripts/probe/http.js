'use strict';

/* eslint-env node */

// The one request path, so timing, headers and the verbatim body are captured identically per row.

/** Mirrors API_TIMEOUT_MS / UPLOAD_TIMEOUT_MS in src/config/env.ts. Copied, not imported. */
const DEFAULT_TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 110000;

/** A free ngrok tunnel answers a browser-shaped request with an HTML interstitial. */
const NGROK_SKIP_HEADER = 'ngrok-skip-browser-warning';

/** ngrok's own error codes, which sit BELOW anything ASP.NET has to say. */
const NGROK_CODES = {
  ERR_NGROK_3200: 'TUNNEL DEAD / NO AGENT',
  ERR_NGROK_3004: 'TUNNEL DEAD / NO AGENT',
  ERR_NGROK_6024: 'BROWSER INTERSTITIAL',
  ERR_NGROK_8012: 'TUNNEL UP, UPSTREAM DOWN',
  ERR_NGROK_8013: 'TUNNEL UP, UPSTREAM DOWN',
};

// Never throws: a transport failure is a finding to record, not a crash.
async function request(spec) {
  const {
    method = 'GET',
    url,
    token = null,
    authLabel = 'none',
    headers = {},
    body = null,
    timeoutMs,
    skipNgrokHeader = false,
    upload = false,
  } = spec;

  const sent = { ...headers };
  if (!skipNgrokHeader) sent[NGROK_SKIP_HEADER] = 'true';
  if (token) sent.Authorization = `Bearer ${token}`;

  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  let status = null;
  let statusText = '';
  let responseHeaders = {};
  let bodyText = '';
  let transportError = null;

  try {
    const res = await fetch(url, {
      method,
      headers: sent,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(
        timeoutMs ?? (upload ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS),
      ),
    });
    status = res.status;
    statusText = res.statusText;
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    bodyText = await res.text();
  } catch (error) {
    const cause =
      error && error.cause ? ` (cause: ${error.cause.code || error.cause.message})` : '';
    transportError = `${error.name}: ${error.message}${cause}`;
  }

  return {
    method,
    url,
    authLabel,
    sentNgrokSkipHeader: !skipNgrokHeader,
    sentHeaderNames: Object.keys(sent),
    startedAt,
    durationMs: Date.now() - t0,
    status,
    statusText,
    responseHeaders,
    body: bodyText,
    transportError,
  };
}

// No exception middleware anywhere (B5), so L1 is only read once L0 is clean.
function classify(rec) {
  const body = rec.body || '';
  const contentType = rec.responseHeaders['content-type'] || '';

  // L0, the transport.
  if (rec.transportError) {
    return { layer: 'L0', verdict: 'TRANSPORT ERROR', detail: rec.transportError };
  }

  const ngrokCode = /ERR_NGROK_\d+/.exec(body);
  if (ngrokCode) {
    const code = ngrokCode[0];
    return {
      layer: 'L0',
      verdict: NGROK_CODES[code] || 'NGROK TUNNEL LAYER',
      detail: `${code} — not evidence about any route`,
    };
  }

  if (/^text\/html/i.test(contentType)) {
    return {
      layer: 'L0',
      verdict: 'HTML WHERE JSON BELONGS',
      detail: `content-type ${contentType} — not evidence about any route`,
    };
  }

  if (rec.status === 502 || rec.status === 504) {
    return {
      layer: 'L0',
      verdict: 'TUNNEL UP, UPSTREAM DOWN',
      detail: `HTTP ${rec.status}`,
    };
  }

  // L1, routing and activation.
  if (/Unable to resolve service for type/.test(body)) {
    const type = /Unable to resolve service for type '([^']+)'/.exec(body);
    const named = type ? type[1] : 'unknown type';
    const isFarmer = /IFarmerService/.test(body);
    return {
      layer: 'L1',
      verdict: isFarmer
        ? 'B1 — ROUTE EXISTS, ACTIVATION FAILED'
        : 'DI FAILURE — ROUTE EXISTS',
      detail: `cannot resolve ${named}`,
    };
  }
  if (/AutoMapperMappingException/.test(body)) {
    return {
      layer: 'L1',
      verdict: 'B4 — AUTOMAPPER THREW AFTER THE WRITE',
      detail: 'AutoMapperMappingException',
    };
  }
  if (/KeyNotFoundException|Issue not found/.test(body)) {
    return {
      layer: 'L1',
      verdict: 'LIVE ROUTE, NO SUCH ROW',
      detail: 'KeyNotFoundException',
    };
  }
  if (/UnauthorizedAccessException/.test(body)) {
    return {
      layer: 'L1',
      verdict: 'LIVE ROUTE, AUTH LOGIC REFUSED',
      detail: 'UnauthorizedAccessException',
    };
  }
  if (/InvalidOperationException/.test(body)) {
    return {
      layer: 'L1',
      verdict: 'LIVE ROUTE, STATUS GUARD REFUSED',
      detail: 'InvalidOperationException',
    };
  }
  if (rec.status === 401) {
    return {
      layer: 'L1',
      verdict: 'MIDDLEWARE: UNAUTHENTICATED',
      detail: 'before the controller',
    };
  }
  if (rec.status === 403) {
    return {
      layer: 'L1',
      verdict: 'MIDDLEWARE: ROLE REFUSED',
      detail: 'before the controller',
    };
  }
  if (rec.status === 404) {
    return {
      layer: 'L1',
      verdict: 'ROUTE NOT PRESENT',
      detail: '404, no exception body',
    };
  }
  if (rec.status === 405) {
    return { layer: 'L1', verdict: 'ROUTE PRESENT, WRONG VERB', detail: '405' };
  }

  // L2, the payload.
  if (rec.status >= 200 && rec.status < 300) {
    return { layer: 'L2', verdict: 'ANSWERED', detail: `HTTP ${rec.status}` };
  }
  if (rec.status >= 300 && rec.status < 400) {
    return {
      layer: 'L0',
      verdict: 'REDIRECTED',
      detail: `HTTP ${rec.status} to ${rec.responseHeaders.location || '(no location header)'}`,
    };
  }
  return { layer: 'L1', verdict: `HTTP ${rec.status}`, detail: rec.statusText || '' };
}

module.exports = {
  request,
  classify,
  DEFAULT_TIMEOUT_MS,
  UPLOAD_TIMEOUT_MS,
  NGROK_SKIP_HEADER,
};
