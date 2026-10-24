'use strict';

// Bodies are never pretty-printed or reordered; only credentials are redacted, labelled inline.

const MATCHES = require('./matches');
const { SERVICE_GROUPS } = require('./plan');

/** Section references in the probe's own meta text, normalised to the repository's style. */
function normaliseRefs(text) {
  return String(text == null ? '' : text)
    .replace(/\bS(\d)\.(\d)\b/g, '§$1.$2')
    .replace(/\bS(\d)\b/g, '§$1');
} /** Long enough to be unreadable in a table cell, or carrying a newline. */
const INLINE_LIMIT = 180;

function cell(text) {
  return String(text == null ? '' : text)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function isInlineable(body) {
  return body != null && body.length <= INLINE_LIMIT && !/\r?\n/.test(body);
}

function bodyCell(row) {
  if (row.skipped) return `**${row.skipped}**`;
  if (row.sourceRead) return cell(row.body);
  const body = row.body == null ? '' : row.body;
  if (body === '') {
    return row.transportError ? cell(row.transportError) : '*(empty body)*';
  }
  if (isInlineable(body)) return '`' + cell(body) + '`';
  return `&darr; ${row.id}`;
}

function httpCell(row) {
  if (row.skipped) return '&mdash;';
  if (row.sourceRead) return 'NOT CALLED';
  if (row.status == null) return '*(no response)*';
  return String(row.status);
}

function headerLine(row) {
  const headers = row.responseHeaders || {};
  const picked = Object.keys(headers)
    .filter(k => /^ngrok|^content-type$|^content-length$|^server$|^location$/i.test(k))
    .sort()
    .map(k => `${k}: ${headers[k]}`);
  return picked.length
    ? picked.join(' | ')
    : '*(no ngrok-\\*, content-type, server or location header)*';
}

function renderGroup(groupKey, groupTitle, rows) {
  const mine = rows.filter(r => r.group === groupKey);
  if (!mine.length) return '';

  const lines = [];
  lines.push(`### ${groupTitle}`, '');
  lines.push(
    '| endpoint | method | auth | HTTP | verbatim body (or verbatim error) | matches §4? | what this unblocks |',
  );
  lines.push('|---|---|---|---|---|---|---|');
  for (const row of mine) {
    lines.push(
      `| **${row.id}** ${cell(normaliseRefs(row.endpoint))} | ${cell(row.method)} | ${cell(row.auth)} | ${httpCell(row)} ` +
        `| ${bodyCell(row)} | ${cell(MATCHES[row.id] || normaliseRefs(row.matches))} | ${cell(normaliseRefs(row.unblocks))} |`,
    );
  }
  lines.push('');

  lines.push(`#### Call detail - ${groupTitle}`, '');
  for (const row of mine) {
    if (row.sourceRead) {
      lines.push(
        `**${row.id}** - not called. Shape read from backend source at \`origin/master\` \`41549c7\`. ` +
          'Source-read, not observed.',
        '',
      );
      continue;
    }
    if (row.skipped) {
      lines.push(`**${row.id}** - ${row.skipped}. ${row.skippedWhy || ''}`.trim(), '');
      continue;
    }
    const bits = [
      row.startedAt,
      `${row.durationMs} ms`,
      `HTTP ${row.status == null ? '(none)' : row.status}`,
      `${row.classification.layer} ${row.classification.verdict}`,
    ];
    if (row.classification.detail) bits.push(row.classification.detail);
    if (row.rowCount != null) bits.push(`rows: ${row.rowCount}`);
    if (row.sentNgrokSkipHeader === false)
      bits.push('**sent WITHOUT the ngrok skip header**');
    lines.push(`**${row.id}** - ${bits.join(' | ')}`);
    lines.push('');
    lines.push(`- response headers: ${headerLine(row)}`);
    if (row.stability) lines.push(`- stability: ${row.stability}`);
    if (row.note) lines.push(`- ${normaliseRefs(row.note)}`);
    lines.push('');
    if (!isInlineable(row.body) && row.body) {
      lines.push(`Verbatim body, **${row.id}**:`, '', '```', row.body, '```', '');
    }
    if (row.reformatted) {
      lines.push(
        `Reformatted for reading only - the verbatim body above is the record, **${row.id}**:`,
        '',
        '```',
        row.reformatted,
        '```',
        '',
      );
    }
  }
  return lines.join('\n');
}

function renderVerdict(verdict) {
  const lines = [`## ${verdict.id} - ${verdict.title}`, '', `### ${verdict.verdict}`, ''];
  lines.push(verdict.text, '');
  if (verdict.evidence && verdict.evidence.length) {
    lines.push(`**Evidence:** ${verdict.evidence.join(', ')}`, '');
  }
  return lines.join('\n');
}

function render({ meta, rows, verdicts, disagreements, sections }) {
  const out = [];

  out.push(`# Server probe - ${meta.dateLong}`);
  out.push('');
  out.push(
    '> **This file outranks `BACKEND-INTEGRATION-FACTS.md` on anything on the wire.** That document',
    '> was compiled by reading C#; this one was compiled by calling the running deployment. Where the',
    '> two disagree about a status code, a field name, a field type or an enum spelling, **this file**',
    '> **wins**, and every disagreement is listed in the last section. `BACKEND-INTEGRATION-FACTS.md`',
    '> stays authoritative for everything this probe did not reach: each row below marked UNTESTED,',
    '> SKIPPED or NOT CALLED leaves that document in force.',
  );
  out.push('');
  out.push('| | |');
  out.push('|---|---|');
  out.push(`| Run started | ${meta.runStartedAt} |`);
  out.push(`| Run finished | ${meta.runFinishedAt} |`);
  out.push(`| Origin probed | \`${meta.base}\` |`);
  out.push(`| URL shape | ${meta.shape} |`);
  out.push(`| Frontend branch | \`${meta.branch}\` at \`${meta.commit}\` |`);
  out.push(
    '| Backend revision deployed | **UNKNOWN - and it is not `41549c7`.** See the first section |',
  );
  out.push(
    '| Contract under test | `BACKEND-INTEGRATION-FACTS.md`, compiled 13 October 2026 against `41549c7` |',
  );
  out.push(`| Re-run with | \`${meta.probeCommand}\` |`);
  out.push(`| Node | ${meta.node} |`);
  out.push(`| Calls made | ${meta.callCount} in this run; 120 across the three runs |`);
  if (meta.comparisonRuns && meta.comparisonRuns.length) {
    out.push(`| Compared against | ${meta.comparisonRuns.join(', ')} |`);
  }
  out.push('');
  out.push(
    'Rows read `{BASE}/api/...` so they survive the tunnel address changing; the literal origin is in',
    'the table above. **No token, password or email appears anywhere in this file.** Where a response',
    'body carried one, that value alone is replaced with a labelled placeholder such as',
    '`<redacted JWT, 756 chars>`. Nothing else about any body is altered - not the key order, not the',
    'whitespace, not the spelling.',
  );
  out.push('');

  out.push('## How to read a failed row - the three layers', '');
  out.push(
    'This deployment sits behind an ngrok tunnel into a Kubernetes cluster, so a failure can come',
    'from the tunnel, from the routing in front of a service, or from the service itself. Each row',
    'therefore carries a layer, and **no row is given a higher reading until the lower one is clean**.',
    '',
    'The ladder below was written before the run. **The run disproved its premise:** B5 said there is',
    'no exception middleware anywhere, so every refusal would arrive as a 500 carrying its exception',
    'text. In fact three structured error shapes exist, and the refusals that *are* bare 500s carry',
    '**no body at all** - so the L1 signatures below that depend on reading exception text were never',
    'observable on this deployment. The ladder is kept because the method is still right and because',
    'a later reader needs to know what was looked for; the column marked **observed?** says what',
    'actually happened.',
  );
  out.push('');
  out.push('| Layer | What it is | What it looks like | observed? |');
  out.push('|---|---|---|---|');
  out.push(
    '| **L0** | the tunnel and the ingress | `ERR_NGROK_*`, or HTML where JSON belongs: no agent. ' +
      '502 / 504: tunnel up, upstream down. `text/plain` `404 page not found`: the **ingress** has no ' +
      'route for that path - Go, not ASP.NET, which answers an unmatched route with an empty 404 | ' +
      '**No tunnel failure occurred at all.** The ingress 404 did, on 5 rows covering 2 of the 4 URL forms ' +
      '(H0a-H0c, H1, H4). Never evidence about a route inside a service |',
  );
  out.push(
    "| **L1** | ASP.NET routing, activation and refusal | Looked for: `Unable to resolve service for type '...IFarmerService'` (**B1**), " +
      '`KeyNotFoundException`, `UnauthorizedAccessException`, `InvalidOperationException` in the body; ' +
      '401 / 403 from middleware; a bare 404 for an absent route | **B1 never occurred** - no response ' +
      'anywhere carried a DI error, which is how this run knows `IFarmerService` is registered. ' +
      '**No exception text was ever observable:** a missing row came back as a `404` **code envelope**, ' +
      'and every guard refusal as an **empty** 500. 401 and 403 both arrived, from middleware, empty |',
  );
  out.push(
    '| **L2** | the payload | 2xx. Field names, casing, enum names-vs-integers, against the contract | Reached on 31 of the 59 rows. This is where most of the document lives |',
  );
  out.push('');

  for (const section of sections.preamble || []) {
    out.push(section, '');
  }

  out.push('## Every endpoint, one row each', '');
  for (const [key, title] of SERVICE_GROUPS) {
    const block = renderGroup(key, title, rows);
    if (block) out.push(block);
  }

  out.push('---', '');
  out.push('# The five verdicts', '');
  for (const verdict of verdicts) {
    out.push(renderVerdict(verdict));
  }

  out.push('---', '');
  out.push('# Where the server disagrees with `BACKEND-INTEGRATION-FACTS.md`', '');
  if (!disagreements.length) {
    out.push('Nothing observed on the wire contradicted that document.', '');
  } else {
    out.push('| # | That document says | The wire says | Rows |');
    out.push('|---|---|---|---|');
    for (const d of disagreements) {
      out.push(
        `| ${cell(d.section)} | ${cell(d.says)} | ${cell(d.wire)} | ${cell(d.rows)} |`,
      );
    }
    out.push('');
  }

  for (const section of sections.closing || []) {
    out.push(section, '');
  }

  return `${out.join('\n')}\n`;
}

module.exports = { render };
