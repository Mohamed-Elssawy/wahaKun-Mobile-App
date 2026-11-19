// English-frame plugin. COPY, TEMPLATES, DECK and META are prepended by the generator.
// Run: npm run figma:plugin

// A probe's name is fixed, not random, so a run killed mid-measure can still be swept up by the next one.
const SENTINEL = '__wk-measure__';

// How a built page is recognised: Button 3 stamps it, Button 4 refuses to measure anything without it.
const EN_SUFFIX = ' · lang=en';

// Which file a layer's English came from; without it, reverse-mapping by text alone misfiled 44 of 835 layers on Farmer 2.
const SOURCE_KEY = 'wk-source';

// Stamped on a probe the moment it exists, so a run killed before the rename still leaves something the sweep can find by stamp OR name.
const PROBE_KEY = 'wk-probe';

// Set on every node the mirror writes to; clearInheritedMarks strips it from a fresh clone first, since D-FIG-3 runs the mirror only on clones and an inherited mark would make it skip the whole twin.
const MIRROR_KEY = 'wk-mirror';
const MIRROR_MARK = 'd-fig-3';

// Code points, not a character class, so the ranges stay reviewable in a diff.
const ARABIC_RANGES = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfefc],
];

let out = [];
const log = line => out.push(line === undefined ? '' : line);

/** Pushed to the TOP of the report once the run ends, so a crash can't read as a quiet success the way 799 silent throws once did. */
let verdict = '';

function setVerdict(line) {
  verdict = line;
}

/** Trim, fold CRLF, collapse whitespace, then NFC-normalize (guarded, since this runtime may lack Unicode tables) — must stay identical to the generator's `norm`. */
function norm(value) {
  const text = String(value === null || value === undefined ? '' : value)
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  return text.normalize ? text.normalize('NFC') : text;
}

function hasArabic(text) {
  for (let at = 0; at < text.length; at += 1) {
    const code = text.charCodeAt(at);
    for (const range of ARABIC_RANGES) {
      if (code >= range[0] && code <= range[1]) return true;
    }
  }
  return false;
}

/** ASCII only, deliberately: the question is "has some English been composed in" (SPEC 16.8 content or an unresolved slot), counted apart from residue nobody has drafted for. */
function hasLatin(text) {
  return /[A-Za-z]/.test(text);
}

/** A page holding masters is the components page: Button 2's only target, and nothing else's. */
function mastersOn(page) {
  return page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] });
}

function isEnglishPage(page) {
  return page.name.indexOf(EN_SUFFIX) !== -1;
}

// Pages this run appended a probe to; Button 3 measures on the clone, so figma.currentPage alone isn't enough to sweep.
let probedPages = [];

/** A probe, by what it is or by what it is called. Either alone leaves a window open. */
function isProbe(node) {
  if (node.name === SENTINEL) return true;
  return !!(node.getPluginData && node.getPluginData(PROBE_KEY));
}

/** Clears probes a previous run left behind; scoped to the current page plus pages this run touched, since loading every page just to sweep two is wasted cost. */
function sweepProbes(page) {
  let swept = 0;

  const pages = page ? [page] : [];
  for (const probed of probedPages) if (pages.indexOf(probed) === -1) pages.push(probed);

  for (const each of pages) {
    for (const stale of each.findAll(isProbe)) {
      stale.remove();
      swept += 1;
    }
  }

  return swept;
}

/** Not always `figma.currentPage` — Button 3 measures on the clone while the Arabic original stays current, and a probe must never land on that page. */
function pageOf(node) {
  let current = node;
  while (current && current.type !== 'PAGE') current = current.parent;
  return current;
}

/** The top-level frame a layer sits in, which is how a human finds it on the canvas. */
function frameOf(node) {
  let current = node;
  while (current.parent && current.parent.type !== 'PAGE') current = current.parent;
  return current.name;
}

function pad(value, width) {
  let text = String(value);
  while (text.length < width) text = ' ' + text;
  return text;
}

function heading(title) {
  log('=== ' + title);
  log('page: ' + figma.currentPage.name);
  log(
    'deck: ' +
      META.approved +
      ' approved chrome rows, ' +
      META.keys +
      ' distinct strings, ' +
      META.templates +
      ' templates',
  );
  log();
}

/** A slot's value resolves through the same deck/mockup chain as the layer, one hop only — unresolved stays Arabic, the correct L-AS-AUTHORED fallback for app-rendered content like `{diagnosis}`. */
function resolveSlot(value) {
  const key = norm(value);

  const exact = COPY[key];
  if (exact) return { en: exact.en, source: 'deck', key: exact.key };

  const dressing = MOCKUP[key];
  // A do-not-translate marker means the same inside a slot as it does at the top level.
  if (dressing && norm(dressing.en) !== key) return { en: dressing.en, source: 'mockup' };

  return null;
}

/** Binds placeholders by bracketing the literal segments either side of each one, since numbers like `6` in `الخطوة 0 من 6` won't match the deck's `{step}`/`{total}` template literally; null means the segments didn't bracket cleanly. */
function fillTemplate(entry, text) {
  const segs = entry.segs;
  if (text.indexOf(segs[0]) !== 0) return null;

  const values = [];
  let at = segs[0].length;

  for (let i = 1; i < segs.length; i += 1) {
    const seg = segs[i];

    if (seg === '') {
      // Only a trailing placeholder may follow an empty segment; two adjacent ones can't be split apart.
      if (i !== segs.length - 1 || at >= text.length) return null;
      values.push(text.slice(at));
      at = text.length;
      break;
    }

    const found = text.indexOf(seg, at + 1);
    if (found === -1) return null;
    values.push(text.slice(at, found));
    at = found + seg.length;
  }

  if (at !== text.length) return null;
  for (const value of values) if (value === '') return null;

  const bound = {};
  const slots = { deck: 0, mockup: 0, unresolved: [] };

  entry.names.forEach((name, index) => {
    const value = values[index];
    const slot = resolveSlot(value);

    if (slot) {
      bound[name] = slot.en;
      slots[slot.source] += 1;
      return;
    }

    bound[name] = value;

    // A numeral needs no translation (L-NO-DIGITS), so only a value still carrying Arabic is a drafting gap.
    if (hasArabic(value)) slots.unresolved.push(value);
  });

  let english = entry.en;
  const unfilled = [];

  for (const name of entry.enNames) {
    if (bound[name] === undefined) {
      unfilled.push(name);
      continue;
    }
    english = english.split('{' + name + '}').join(bound[name]);
  }

  return { en: english, unfilled, slots };
}

/** Precedence (approved deck row -> deck template -> mockup row -> leave Arabic) is the whole guarantee the two copy layers never mix; `source` is set once here so no button can sum deck coverage with mockup set-dressing. */
function resolve(text) {
  const key = norm(text);

  const exact = COPY[key];
  if (exact)
    return {
      state: 'approved',
      source: 'deck',
      en: exact.en,
      key: exact.key,
      max: exact.max,
    };

  for (const entry of TEMPLATES) {
    const filled = fillTemplate(entry, key);
    if (filled) {
      return {
        state: 'template',
        source: 'deck',
        en: filled.en,
        key: entry.key,
        max: entry.max,
        unfilled: filled.unfilled,
        slots: filled.slots,
      };
    }
  }

  const dressing = MOCKUP[key];
  if (dressing) {
    // `en` equal to `ar` is an explicit instruction to leave the layer alone, not a no-op write.
    if (norm(dressing.en) === key) return { state: 'keep', note: dressing.note };

    return { state: 'mockup', source: 'mockup', en: dressing.en, note: dressing.note };
  }

  const drafted = DECK.draft[key];
  if (drafted) return { state: 'draft', key: drafted.key, status: drafted.status };

  const kind = DECK.notChrome[key];
  if (kind) return { state: 'notChrome', kind };

  return { state: 'missing' };
}

/** Walks the page once and buckets every text layer. Reads only. */
function survey(page) {
  const texts = page.findAllWithCriteria({ types: ['TEXT'] });
  const counts = {
    text: 0,
    latin: 0,
    arabic: 0,
    ambiguous: 0, // counted apart from latin/sourced so declaring an ambiguity has a visible cost
    approved: 0,
    template: 0,
    mockup: 0,
    keep: 0,
    unfilled: 0,
    slotFilled: 0,
    slotFromMockup: 0,
    partial: 0,
  };
  const buckets = { draft: new Map(), notChrome: new Map(), missing: new Map() };
  // Drafting gaps the four buckets can't express: an Arabic slot value with no row, and the part-Arabic layer it leaves.
  const slotGaps = new Map();
  const partials = new Map();
  const resolved = [];

  for (const node of texts) {
    counts.text += 1;

    const characters = node.characters;

    // Classified before the not-Arabic test, or a Latin ambiguity disappears into `latin` unreported.
    if (AMBIGUOUS[norm(characters)]) {
      counts.ambiguous += 1;
      continue;
    }

    if (!hasArabic(characters)) {
      counts.latin += 1;
      continue;
    }
    counts.arabic += 1;

    const found = resolve(characters);
    const key = norm(characters);
    const where = frameOf(node) + ' › ' + node.name;

    if (found.state === 'keep') {
      counts.keep += 1;
      continue;
    }

    if (
      found.state === 'approved' ||
      found.state === 'template' ||
      found.state === 'mockup'
    ) {
      counts[found.state] += 1;
      if (found.unfilled && found.unfilled.length) counts.unfilled += 1;

      if (found.slots) {
        if (found.slots.deck || found.slots.mockup) counts.slotFilled += 1;
        if (found.slots.mockup) counts.slotFromMockup += 1;

        for (const value of found.slots.unresolved) {
          const seen = slotGaps.get(value);
          if (seen) seen.count += 1;
          // The host string, not node.name — a layer keeps the name it was created with, often stale.
          else
            slotGaps.set(value, {
              count: 1,
              key: found.key,
              host: key,
              frame: frameOf(node),
            });
        }
      }

      // Deck copy still carrying Arabic after slots resolved — correct per L-AS-AUTHORED, but counted apart from English.
      if (hasArabic(found.en)) {
        counts.partial += 1;
        const seen = partials.get(key);
        if (seen) seen.count += 1;
        else partials.set(key, { count: 1, found, where });
      }

      resolved.push({ node, found });
      continue;
    }

    const bucket = buckets[found.state];
    const seen = bucket.get(key);

    if (seen) {
      seen.count += 1;
      continue;
    }

    bucket.set(key, { count: 1, found, where });
  }

  return { counts, buckets, slotGaps, partials, resolved };
}

function logBucket(title, bucket, describe) {
  const entries = [...bucket.entries()];
  if (!entries.length) return;

  let layers = 0;
  for (const entry of entries) layers += entry[1].count;

  log();
  log('--- ' + title + ': ' + layers + ' layer(s), ' + entries.length + ' string(s)');

  entries.sort((a, b) => b[1].count - a[1].count);

  for (const entry of entries) {
    const key = entry[0];
    const row = entry[1];
    log('  ' + pad(row.count, 4) + 'x  ' + key);
    log('        ' + row.where + describe(row.found));
  }
}

/** Shared by Buttons 1, 3 and 4 so they can't drift into disagreeing about the same page; deck coverage and mockup set-dressing are never summed or shared on a line. */
function logFourWay(counts) {
  // Button 3 supplies its own share/denominator since it excludes layers held by instruction; Button 1 has nothing to exclude.
  const share =
    counts.share === undefined
      ? counts.arabic
        ? Math.round((counts.deck / counts.arabic) * 100)
        : 0
      : counts.share;

  log('LAYERS');
  log('  text layers                        ' + pad(counts.text, 6));
  log(
    '  already Latin or numerals          ' +
      pad(counts.latin, 6) +
      '   nothing to translate',
  );
  log('  Arabic text layers                 ' + pad(counts.arabic, 6));
  log();
  log('PAINTED');
  log(
    '  from the app deck                  ' +
      pad(counts.deck, 6) +
      '   ' +
      share +
      '% of this page',
  );

  if (counts.shareNote) log('      ' + share + '% — ' + counts.shareNote);

  if (counts.slotFilled) {
    log(
      '      with slot values resolved     ' +
        pad(counts.slotFilled, 6) +
        '   ' +
        counts.slotFromMockup +
        ' of them from the mockup layer',
    );
  }

  if (counts.partial) {
    log(
      '      still holding Arabic          ' +
        pad(counts.partial, 6) +
        '   SPEC 16.8 content, listed below',
    );
  }

  log(
    '  from the mockup layer              ' +
      pad(counts.mockup, 6) +
      '   presentation only, NOT app copy',
  );
  log(
    '  never summed: ' +
      counts.deck +
      ' is the deck’s own coverage, ' +
      counts.mockup +
      ' is set dressing',
  );

  if (counts.unfilled) {
    log(
      '  template braces left visible       ' +
        pad(counts.unfilled, 6) +
        '   the Arabic did not supply every value',
    );
  }

  log();
  log('LEFT ALONE, DELIBERATELY');
  log(
    '  do not translate                   ' +
      pad(counts.keep, 6) +
      '   the mockup file gives en equal to ar',
  );
}

/** Why each remaining layer is still Arabic, then one total — without ever summing deck coverage and mockup set-dressing. */
function logLeftInArabic(buckets, counts) {
  let total = 0;

  const summarise = (name, label) => {
    let layers = 0;
    for (const entry of buckets[name].values()) layers += entry.count;
    total += layers;
    log('  ' + label + pad(layers, 6) + '   ' + buckets[name].size + ' distinct');
  };

  log();
  log('LEFT IN ARABIC, AND WHY');
  summarise('draft', 'drafted, awaiting approval        ');
  summarise('notChrome', 'content SPEC 16.8 never translates');
  summarise('missing', 'in neither file                   ');
  log('  total left in Arabic              ' + pad(total, 6));

  const showing = total + counts.partial + counts.keep;

  log();
  log(
    '  this page shows Arabic on ' +
      showing +
      ' layer(s): ' +
      total +
      ' untranslated + ' +
      counts.partial +
      ' part-Arabic + ' +
      counts.keep +
      ' do-not-translate',
  );
}

/** Invisible in the four buckets by construction — the host layer already counts as painted — so without this list the gap is an untraceable part-Arabic frame. */
function logSlotGaps(slotGaps) {
  const entries = [...slotGaps.entries()];
  if (!entries.length) return;

  let layers = 0;
  for (const entry of entries) layers += entry[1].count;

  log();
  log(
    '--- SLOT VALUES WITH NO ROW: ' +
      entries.length +
      ' string(s), inside ' +
      layers +
      ' deck-painted layer(s)',
  );
  log(
    'A row for one of these in the mockup file paints every layer that interpolates it.',
  );

  entries.sort((a, b) => b[1].count - a[1].count);

  for (const entry of entries) {
    log('  ' + pad(entry[1].count, 4) + 'x  ' + entry[0]);
    log(
      '        inside "' +
        entry[1].host +
        '"   ' +
        (entry[1].key || '(no finalKey)') +
        '   ' +
        entry[1].frame,
    );
  }
}

/** Every Arabic string the mockup layer doesn't cover, as paste-ready rows for design/MOCKUP-COPY.tsv — avoids hand-transcribing a report, which is how 116 rows once acquired a typo. */
function logDump(buckets, slotGaps, built) {
  const rows = new Map();

  for (const name of ['missing', 'notChrome']) {
    for (const entry of buckets[name].entries()) rows.set(entry[0], entry[1].count);
  }

  for (const entry of slotGaps.entries()) {
    rows.set(entry[0], (rows.get(entry[0]) || 0) + entry[1].count);
  }

  let drafted = 0;
  for (const entry of buckets.draft.values()) drafted += entry.count;

  log();
  log('--- PASTE-READY · ' + rows.size + ' string(s) with no English in either file');

  // This counts strings nobody has drafted for, not whether existing English reached the artboard — only the gate below answers that.
  if (built) {
    log(
      'Counted from the pre-write survey: these are strings with no English, not layers that',
    );
    log('failed. Blocked and failed layers are in NOT WRITTEN and RESIDUE above.');
  }
  log('Copy the lines between the markers into design/MOCKUP-COPY.tsv, most-used first.');
  log(
    'Columns are ar <TAB> en <TAB> note, so each line below needs its English typed in.',
  );

  if (drafted) {
    log(
      drafted +
        ' drafted layer(s) are excluded: approving the deck row paints them, and a' +
        ' mockup row would lose to it.',
    );
  }

  if (!rows.size) {
    // The gate: all four conditions must hold, or this line says what's wrong instead.
    if (!built || built.covered) {
      log('Nothing to draft. This page is covered.');
    } else {
      log(
        'Nothing to draft - but this page is NOT covered. See NOT WRITTEN and RESIDUE above:',
      );
      log(
        'something was blocked, threw, or is still Arabic, and no amount of drafting fixes that.',
      );
    }
    return;
  }

  log('--- 8< ------------------------------------------------------------------');
  for (const entry of [...rows.entries()].sort((a, b) => b[1] - a[1])) {
    log(entry[0] + '\t\t');
  }
  log('--- >8 ------------------------------------------------------------------');
}

/** Every TEXT node reaches exactly one of these; `blocked-font`/`failed-write` are terminal in their own right because a throw once got silently counted as resolved (799 of 920 layers, reported as "covered"). */
const STATES = [
  'written-deck',
  'written-template',
  'written-mockup',
  'skipped-already-latin',
  'skipped-do-not-translate',
  'skipped-override-refused',
  // A declared ambiguity (scripts/i18n-ambiguous.js) gets its own state, not a fold into skipped-already-latin, since some are Latin.
  'skipped-ambiguous',
  'left-arabic-no-source',
  'blocked-font',
  'failed-write',
];

/** Which written state a resolution lands in. The table is the mapping; there is no fallback. */
const WRITTEN_STATE = {
  approved: 'written-deck',
  template: 'written-template',
  mockup: 'written-mockup',
};

const WRITTEN = ['written-deck', 'written-template', 'written-mockup'];
const SKIPPED = [
  'skipped-already-latin',
  'skipped-do-not-translate',
  'skipped-override-refused',
];

function newTally() {
  const tally = { nodesScanned: 0 };
  for (const state of STATES) tally[state] = 0;
  return tally;
}

/** Throws on an unknown state, so a typo cannot quietly unbalance the equation. */
function mark(tally, state) {
  if (tally[state] === undefined) {
    throw new Error('unknown terminal state "' + state + '"');
  }
  tally[state] += 1;
}

function sumOf(tally, group) {
  let total = 0;
  for (const state of group) total += tally[state];
  return total;
}

/** Figma's refusal to override some instance properties is not a bug — expected to read 0 since text overrides inside an instance are normally permitted. */
function isOverrideRefusal(message) {
  return /instance|override|read-?only|cannot be modified/i.test(message);
}

/** Printed whether or not it balances, since a report that can't add up is lying; covers only the TEXT nodes the write pass scanned, not the separate layout walk. */
function logEquation(tally) {
  const written = sumOf(tally, WRITTEN);
  const skipped = sumOf(tally, SKIPPED);
  const left = tally['left-arabic-no-source'];
  const blocked = tally['blocked-font'];
  const failed = tally['failed-write'];
  // Its own term, not folded into `skipped`, so a declared ambiguity can't hide inside a number nobody reads.
  const ambiguous = tally['skipped-ambiguous'];
  const sum = written + skipped + ambiguous + left + blocked + failed;

  log();
  log(
    'NODES · ' +
      tally.nodesScanned +
      ' scanned = ' +
      written +
      ' written + ' +
      skipped +
      ' skipped + ' +
      ambiguous +
      ' ambiguous + ' +
      left +
      ' left + ' +
      blocked +
      ' blocked + ' +
      failed +
      ' failed',
  );

  if (sum !== tally.nodesScanned) {
    log(
      '  THE EQUATION DOES NOT BALANCE. The states sum to ' +
        sum +
        ' against ' +
        tally.nodesScanned +
        ' scanned, so every number in this report is suspect.',
    );
  }

  return {
    written,
    skipped,
    ambiguous,
    left,
    blocked,
    failed,
    balances: sum === tally.nodesScanned,
  };
}

/** Printed on every run, not only when something changes, since a declared ambiguity leaves those layers' text untouched and silently so otherwise. */
function logAmbiguous(nodes) {
  const declared = Object.keys(AMBIGUOUS);

  if (!declared.length) return;

  log();
  log(
    'AMBIGUOUS BY ARABIC · ' +
      declared.length +
      ' declared, ' +
      nodes.length +
      ' layer(s)',
  );
  log(
    '  The same Arabic means different English on different screens, so no table keyed on',
  );
  log(
    '  Arabic can rewrite it. These layers were LEFT AS DRAWN. Scoping the lookup by screen',
  );
  log('  is D-FIG-4, and it lands before the next Button 3 run.');

  for (const key of declared) {
    const entry = AMBIGUOUS[key];
    const here = nodes.filter(node => norm(node.ar) === key);

    log();
    log('  ' + entry.ar + '   ' + here.length + ' layer(s)');
    for (const named of entry.keys) {
      log(
        '    ' +
          named.screen +
          '  ' +
          named.key +
          '  -> ' +
          named.en +
          '   (' +
          named.why +
          ')',
      );
    }
    if (!here.length) {
      log('    no layer on this page carries it');
    }
    for (const node of here) log('    · ' + node.where);
  }
}

// SPEC 16.6: the wordmark's Latin half is always Lora (Arabic has no glyphs for it, so that half is Cairo) — the cross-check below compares frames, not nodes, since the two halves are disjoint layers.
const WORDMARK_FAMILY = 'Lora';

/** A READING of the written page, not a tally of the write pass's intentions — fixes a past "left in Arabic: 0" printed over a wholly Arabic page. */
function measureResidue(page) {
  const frames = new Map();
  // Frames, not nodes — see WORDMARK_FAMILY, the lockup's two halves are two layers.
  const instructedFrames = new Set();
  const wordmarkFrames = new Set();
  let instructed = 0;
  let wholly = 0;
  let partial = 0;

  for (const node of page.findAllWithCriteria({ types: ['TEXT'] })) {
    const characters = node.characters;

    for (const font of facesOn(node)) {
      if (font && font.family === WORDMARK_FAMILY) {
        wordmarkFrames.add(frameOf(node));
        break;
      }
    }

    if (!hasArabic(characters)) continue;

    // Arabic by instruction isn't residue: SPEC 8.1 keeps the S-01 lockup's Arabic half as a brand asset in both locales.
    if (resolve(characters).state === 'keep') {
      instructed += 1;
      instructedFrames.add(frameOf(node));
      continue;
    }

    if (hasLatin(characters)) partial += 1;
    else wholly += 1;

    const frame = frameOf(node);
    frames.set(frame, (frames.get(frame) || 0) + 1);
  }

  return {
    wholly,
    partial,
    instructed,
    instructedFrames,
    wordmarkFrames,
    frames,
    total: wholly + partial,
  };
}

/** Prints the residue beside the write pass's own prediction and the delta — a disagreement is the diagnostic, and the measured number is the true one. */
function logResidue(residue, predicted) {
  log();
  log('RESIDUE · measured by re-reading the page after the write pass');
  log(
    '  still Arabic, wholly              ' +
      pad(residue.wholly, 6) +
      '   nothing anywhere has English for these',
  );
  log(
    '  still Arabic, part-English        ' +
      pad(residue.partial, 6) +
      '   SPEC 16.8 composed in, or a slot value with no row',
  );
  log(
    '  Arabic by instruction             ' +
      pad(residue.instructed, 6) +
      '   واحة كُن - correct, and never counted as residue',
  );

  // Cross-check by frame: every frame with the Arabic lockup half must hold the Lora half too, and vice versa.
  let shared = 0;
  for (const frame of residue.instructedFrames) {
    if (residue.wordmarkFrames.has(frame)) shared += 1;
  }

  const whole =
    residue.instructedFrames.size === residue.wordmarkFrames.size &&
    shared === residue.instructedFrames.size;

  if (whole) {
    log(
      '      the lockup is whole: the same ' +
        shared +
        ' frame(s) hold the Arabic wordmark and the ' +
        WORDMARK_FAMILY +
        ' "Waha KUN"',
    );
  } else {
    log(
      '      MISMATCH: the Arabic wordmark is in ' +
        residue.instructedFrames.size +
        ' frame(s), ' +
        WORDMARK_FAMILY +
        ' in ' +
        residue.wordmarkFrames.size +
        ', ' +
        shared +
        ' shared. A lockup lost a half, or a layer is in the wrong bucket.',
    );
  }

  log(
    '  the write pass predicted          ' +
      pad(predicted, 6) +
      '   left-arabic-no-source',
  );
  log('  delta                             ' + pad(residue.total - predicted, 6));

  if (residue.total !== predicted) {
    log(
      '  The measured page and the write pass disagree. The measured number is the true one;',
    );
    log(
      '  the gap is layers that threw, were blocked, or were written and should not have',
    );
    log('  been. The frames carrying the most residue:');

    const worst = [...residue.frames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const entry of worst) log('      ' + pad(entry[1], 4) + '  ' + entry[0]);
  }
}

// Candidate styles, not one name, since Figma calls Inter's 600 weight "Semi Bold" on some installs and "SemiBold" on others.
const TYPE_MAP = {
  'Noto Sans Arabic|Regular': ['Regular'],
  'Noto Sans Arabic|Medium': ['Medium'],
  'Noto Sans Arabic|SemiBold': ['Semi Bold', 'SemiBold'],
  'Noto Sans Arabic|Semi Bold': ['Semi Bold', 'SemiBold'],
};

// Families that never change (16.6 amended): Cairo keeps headings, Lora is the wordmark, Inter's already the target, Futura PT is diagram-only.
const KEEP_FAMILY = ['Cairo', 'Lora', 'Inter', 'Futura PT'];

// English line height per (size, Arabic line height) pair — keyed on the pair, not size alone, since body14/label14/h6 all carry size 14 at different heights.
const LINE_HEIGHTS = {
  '12/21': 18,
  '14/24.5': 21,
  '16/28': 24,
};

// Label variants already ~1.5 in both locales (16.6), listed so they're not reported as unmapped type.
const UNCHANGED_PAIRS = ['12/18', '14/21', '16/24', '20/30'];

let interStyles = null;

/** Resolved once per run, so 141 nodes don't each list every font on the machine. */
async function availableInterStyles() {
  if (interStyles) return interStyles;

  interStyles = new Set();
  for (const font of await figma.listAvailableFontsAsync()) {
    if (font.fontName.family === 'Inter') interStyles.add(font.fontName.style);
  }
  return interStyles;
}

async function targetFont(fontName) {
  if (KEEP_FAMILY.indexOf(fontName.family) !== -1) return null;

  const candidates = TYPE_MAP[fontName.family + '|' + fontName.style];
  if (!candidates) return null;

  const styles = await availableInterStyles();
  for (const style of candidates) {
    if (styles.has(style)) return { family: 'Inter', style };
  }
  return null;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

/** Pixels, whatever unit the node states it in. AUTO cannot be keyed and is reported. */
function lineHeightPx(lineHeight, fontSize) {
  if (!lineHeight || lineHeight.unit === 'AUTO') return null;
  if (lineHeight.unit === 'PERCENT') return (fontSize * lineHeight.value) / 100;
  return lineHeight.value;
}

/** Loads each font before writing it (the API throws otherwise) and uses getStyledTextSegments so a mixed-font node takes the same path as a uniform one; font size is never written (16.6). */
async function applyEnglishType(node) {
  const segments = node.getStyledTextSegments(['fontName', 'fontSize', 'lineHeight']);
  const notes = [];

  for (const segment of segments) {
    // The font already on the run, or nothing may be written to it at all.
    await figma.loadFontAsync(segment.fontName);

    // Leading changes only where the family changes (16.6 amended) — a kept family keeps its leading too.
    if (KEEP_FAMILY.indexOf(segment.fontName.family) !== -1) continue;

    const target = await targetFont(segment.fontName);

    if (!target) {
      notes.push(
        'no Inter cut mapped for ' +
          segment.fontName.family +
          ' ' +
          segment.fontName.style,
      );
      continue;
    }

    await figma.loadFontAsync(target);
    node.setRangeFontName(segment.start, segment.end, target);

    const current = lineHeightPx(segment.lineHeight, segment.fontSize);

    if (current === null) {
      notes.push(
        'line height is AUTO at ' + segment.fontSize + 'px, so it is left alone',
      );
      continue;
    }

    const pair = segment.fontSize + '/' + round(current);
    const wanted = LINE_HEIGHTS[pair];

    if (wanted === undefined) {
      if (UNCHANGED_PAIRS.indexOf(pair) === -1) {
        notes.push(
          'size/line-height ' +
            pair +
            ' is not in the table, so it keeps its line height',
        );
      }
      continue;
    }

    if (wanted !== current) {
      node.setRangeLineHeight(segment.start, segment.end, {
        value: wanted,
        unit: 'PIXELS',
      });
    }
  }

  return notes;
}

/** Loads every font on a node without changing anything, so characters may be written. */
async function loadExistingFonts(node) {
  for (const segment of node.getStyledTextSegments(['fontName'])) {
    await figma.loadFontAsync(segment.fontName);
  }
}

/** Every face already on a node must load before ANY layout-affecting write (resize, truncation, align, not just `characters`) — skipping this once threw 799 of 920 layers under a report that said "covered". */
function faceKey(font) {
  return font.family + '\u0000' + font.style;
}

/** One call for a mixed node, not one per character across ~900 nodes. */
function facesOn(node) {
  if (node.fontName !== figma.mixed) return [node.fontName];
  return node.getStyledTextSegments(['fontName']).map(segment => segment.fontName);
}

/** Phase A — census, read-only; getStyledTextSegments is the only correct read for a mixed node, since plain `node.fontName` returns `figma.mixed`. */
function censusFaces(page) {
  const faces = new Map();
  const carriers = new Map();

  for (const node of page.findAllWithCriteria({ types: ['TEXT'] })) {
    const on = facesOn(node);

    for (const font of on) if (!faces.has(faceKey(font))) faces.set(faceKey(font), font);

    // Counts layers, not occurrences — a node carrying one face in two runs counts once.
    for (const key of new Set(on.map(faceKey))) {
      carriers.set(key, (carriers.get(key) || 0) + 1);
    }
  }

  return { faces, carriers };
}

/** Every face the run can write, added to the same set via targetFont/listAvailableFontsAsync — never asks for a style the install lacks. */
async function addTargetFaces(faces) {
  for (const font of [...faces.values()]) {
    const target = await targetFont(font);
    if (target && !faces.has(faceKey(target))) faces.set(faceKey(target), target);
  }
}

/** Phase B — load, one settled batch so one unavailable face can't kill the rest; Figma caches loaded fonts, so this pays the cost once rather than per node. */
async function loadFaces(faces) {
  const ok = new Set();
  const bad = new Map();

  await Promise.all(
    [...faces.entries()].map(entry =>
      figma.loadFontAsync(entry[1]).then(
        () => {
          ok.add(entry[0]);
        },
        error => {
          bad.set(entry[0], messageOf(error));
        },
      ),
    ),
  );

  return { ok, bad };
}

/** Phase C — the table, printed before anything is written; an unwritable node (its existing face won't load) takes `blocked-font` and is named rather than worked around. */
function logFontTable(census, loaded) {
  log(
    'FONTS · ' +
      census.faces.size +
      ' face(s) on this page, ' +
      loaded.ok.size +
      ' loaded, ' +
      (loaded.bad.size ? loaded.bad.size + ' UNAVAILABLE' : '0 unavailable'),
  );

  for (const [key, message] of loaded.bad) {
    const font = census.faces.get(key);
    const carried = census.carriers.get(key) || 0;

    log(
      '        "' +
        font.family +
        ' ' +
        font.style +
        '" — ' +
        (carried
          ? carried + ' node(s) carry it and cannot be written'
          : 'a target face, so nothing can be swapped into it'),
    );
    log('          ' + message);
  }
}

/** The one entry point. Every button calls it before its first write. */
async function prepareFonts(page) {
  const census = censusFaces(page);
  await addTargetFaces(census.faces);
  const loaded = await loadFaces(census.faces);
  logFontTable(census, loaded);
  return { census, blocked: loaded.bad };
}

/** The face that makes this node unwritable, or null — decided before a write is attempted, so `blocked-font` is a state rather than a classified throw. */
function blockedFaceOn(node, blocked) {
  if (!blocked || !blocked.size) return null;

  for (const font of facesOn(node)) {
    if (blocked.has(faceKey(font))) return font.family + ' ' + font.style;
  }

  return null;
}

/** Free horizontal space an auto-width layer may grow into; null when the parent hugs contents or isn't horizontal auto-layout, since then the parent grows instead. */
function freeSpaceBeside(node) {
  const parent = node.parent;
  if (!parent || parent.layoutMode !== 'HORIZONTAL') return null;

  const fixed =
    parent.layoutSizingHorizontal === undefined
      ? parent.primaryAxisSizingMode === 'FIXED'
      : parent.layoutSizingHorizontal === 'FIXED';

  if (!fixed) return null;

  const children = parent.children.filter(child => child.visible !== false);
  let used = (parent.paddingLeft || 0) + (parent.paddingRight || 0);
  used += (parent.itemSpacing || 0) * Math.max(0, children.length - 1);
  for (const child of children) used += child.width;

  return parent.width - used;
}

/** The natural size of `english` in this node's own box, measured on a page-appended clone (a sibling in auto-layout would reflow its parent) — `finally` guarantees cleanup even on a throw. */
async function measure(node, english, applyType) {
  let probe = null;

  try {
    probe = node.clone();
    probe.name = SENTINEL;
    // Stamped first, so a run killed before the move leaves something the sweep can find.
    if (probe.setPluginData) probe.setPluginData(PROBE_KEY, SENTINEL);
    probe.visible = false;

    const page = pageOf(node) || figma.currentPage;
    page.appendChild(probe);
    if (probedPages.indexOf(page) === -1) probedPages.push(page);

    // Must run before the first layout write — skipping this once meant 799 nodes threw identically instead of only the first.
    await loadExistingFonts(probe);

    probe.x = 200000;
    probe.y = 0;

    // Lines the Arabic as-drawn needs, from comparing two readings of the same probe (WIDTH_AND_HEIGHT never wraps, so its height is exactly one line).
    probe.textAutoResize = 'WIDTH_AND_HEIGHT';
    const oneLine = probe.height;
    probe.textAutoResize = 'HEIGHT';
    probe.resize(node.width, probe.height);
    const sourceHeight = probe.height;
    const sourceLines = oneLine > 0 ? Math.max(1, Math.round(sourceHeight / oneLine)) : 1;

    // Button 4 measures an already-English page; re-applying the type table there would key off English pairs the Arabic-keyed table can't name.
    const notes = applyType ? await applyEnglishType(probe) : [];
    probe.characters = english;

    if (node.textAutoResize === 'WIDTH_AND_HEIGHT') {
      probe.textAutoResize = 'WIDTH_AND_HEIGHT';
      return {
        width: probe.width,
        height: probe.height,
        axis: 'width',
        sourceLines,
        notes,
      };
    }

    // Reflow at the real width, so the answer is how many lines the English needs here.
    probe.textAutoResize = 'HEIGHT';
    probe.resize(node.width, probe.height);
    return {
      width: node.width,
      height: probe.height,
      axis: 'height',
      sourceLines,
      notes,
    };
  } finally {
    if (probe) probe.remove();
  }
}

/** Both triggers, reported separately, because they are two different people's problems. */
function overflowOf(node, english, measured, max) {
  const reasons = [];

  if (max !== undefined && english.length > max) {
    reasons.push(
      'maxChars: ' + english.length + ' characters against a budget of ' + max,
    );
  }

  if (measured.axis === 'width') {
    const grew = measured.width - node.width;
    const free = freeSpaceBeside(node);

    if (grew > 0.5 && free !== null && grew > free) {
      reasons.push(
        'container: grows ' +
          round(grew) +
          'px with only ' +
          round(free) +
          'px free beside it',
      );
    }
  } else if (measured.height > node.height + 0.5) {
    reasons.push(
      'container: wraps to ' +
        round(measured.height) +
        'px in a ' +
        round(node.height) +
        'px box',
    );
  }

  return reasons;
}

/** Only a fixed-height box is in scope (width/maxChars overflows aren't fixed by resizing); the Arabic's line count decides grow (2+ lines, a paragraph) vs. truncate (1 line, a chip/tab/label by design). */
function overflowFixFor(node, measured) {
  if (measured.axis !== 'height') return null;
  if (measured.height <= node.height + 0.5) return null;

  if (node.textAutoResize === 'HEIGHT') {
    return {
      action: 'none',
      why: 'the box already grows on its own, so nothing is clipped',
    };
  }

  if (node.textAutoResize !== 'NONE') return null;

  if (measured.sourceLines >= 2) {
    return {
      action: 'grow',
      why:
        'the Arabic already wrapped to ' +
        measured.sourceLines +
        ' lines, so the box may take another',
    };
  }

  return {
    action: 'truncate',
    why: 'the Arabic fitted on one line, so this slot is one line by design',
  };
}

/** Writes the decision. Button 3 only - Buttons 1 and 4 report it and change nothing. */
function applyOverflowFix(node, fix) {
  if (fix.action === 'grow') {
    node.textAutoResize = 'HEIGHT';
    return 'textAutoResize=HEIGHT';
  }

  // textAutoResize is already NONE here, which is what makes the box bounded and the truncation bite.
  node.textTruncation = 'ENDING';
  return 'textTruncation=ENDING';
}

/** The source string gets its own line since a layer keeps its creation-time name; the name itself is printed only when it diverges, which is exactly when it misleads. */
function logOverflowRow(row, tense) {
  log('  ' + row.frame);
  log('        ' + (hasArabic(row.source) ? 'ar  ' : 'en  ') + row.source);
  log('        en  ' + (row.key || '(no finalKey)') + '  ' + JSON.stringify(row.english));

  if (norm(row.name) !== norm(row.source)) {
    log(
      '        layer is named "' + row.name + '" - a stale Figma name, not this string',
    );
  }

  for (const reason of row.reasons) log('        ' + reason);

  if (row.fix && row.fix.action === 'none') {
    log('        no fix needed: ' + row.fix.why);
  } else if (row.fix) {
    log(
      '        ' +
        tense +
        ' ' +
        (row.fix.action === 'grow' ? 'textAutoResize=HEIGHT' : 'textTruncation=ENDING') +
        ': ' +
        row.fix.why,
    );
  }
}

/** Measures a resolved set and logs whatever overflows. Shared by Buttons 1 and 4. */
async function logOverflow(resolved, title, applyType, blocked) {
  const rows = [];
  const notes = new Map();

  const failures = [];
  let blockedOut = 0;

  for (const item of resolved) {
    const english = item.found.en;
    // Captured before anything is measured — this is what the layer actually says, which its name often is not.
    const source = item.node.characters;

    // A layer whose face won't load can't be measured either, since measuring clones it and writes to the clone.
    if (blocked && blockedFaceOn(item.node, blocked)) {
      blockedOut += 1;
      continue;
    }

    // Per node, or the first throw took the whole section with it and everything below went unprinted.
    let measured = null;

    try {
      measured = await measure(item.node, english, applyType);
    } catch (error) {
      failures.push(
        frameOf(item.node) + ' › "' + item.node.name + '": ' + messageOf(error),
      );
      continue;
    }

    const reasons = overflowOf(item.node, english, measured, item.found.max);

    for (const note of measured.notes) notes.set(note, (notes.get(note) || 0) + 1);
    if (!reasons.length) continue;

    rows.push({
      frame: frameOf(item.node),
      name: item.node.name,
      source,
      key: item.found.key,
      english,
      reasons,
      fix: overflowFixFor(item.node, measured),
    });
  }

  log();
  log(
    '--- ' + title + ': ' + rows.length + ' of ' + resolved.length + ' measured layer(s)',
  );

  if (!rows.length) log('  nothing overflows.');

  for (const row of rows) logOverflowRow(row, 'would be');

  if (blockedOut) {
    log(
      '  ' +
        blockedOut +
        ' layer(s) could not be measured at all: a face on them would not load (see FONTS)',
    );
  }

  if (failures.length) {
    log();
    log(
      '--- ' +
        failures.length +
        ' layer(s) threw while being measured. A throw is a BUG, not a result',
    );
    for (const failure of failures) log('  ' + failure);
  }

  if (notes.size) {
    log();
    log('--- TYPE THE TABLE DOES NOT NAME. These keep their current line height');
    const entries = [...notes.entries()].sort((a, b) => b[1] - a[1]);
    for (const entry of entries) log('  ' + pad(entry[1], 4) + 'x  ' + entry[0]);
  }

  return rows.length;
}

async function report() {
  heading('REPORT · nothing is written');

  const page = figma.currentPage;
  const masters = mastersOn(page);

  if (masters.length) {
    log(
      'This page holds ' +
        masters.length +
        ' master component(s), so it is the components page.',
    );
    log('Button 2 is the one that runs here. Button 3 refuses to clone it.');
    log();
  }

  // Writes nothing to the page, but it clones and measures, and a probe needs the prepass too.
  const fonts = await prepareFonts(page);
  log();

  const { counts, buckets, slotGaps, partials, resolved } = survey(page);

  let undrafted = 0;
  for (const name of ['notChrome', 'missing']) {
    for (const entry of buckets[name].values()) undrafted += entry.count;
  }

  logFourWay({ ...counts, deck: counts.approved + counts.template });

  logLeftInArabic(buckets, counts);

  logBucket(
    'DRAFTED, AWAITING APPROVAL. Approve the row and this paints itself',
    buckets.draft,
    found => '   ' + (found.key || '(no finalKey)') + '  status=' + found.status,
  );

  logBucket(
    'CONTENT THE APP DID NOT AUTHOR. Correct that this stays Arabic (SPEC 16.8)',
    buckets.notChrome,
    found => '   kind=' + found.kind,
  );

  logBucket(
    'IN NEITHER FILE. Design never built, or copy not yet drafted anywhere',
    buckets.missing,
    () => '',
  );

  logBucket(
    'DECK COPY STILL HOLDING ARABIC. Correct for the app; a slot value is missing here',
    partials,
    found => '   ' + (found.key || '(no finalKey)') + '  -> ' + found.en,
  );

  logSlotGaps(slotGaps);

  // The census that would've found the arrow defect in one click, on the button that writes nothing.
  await logInstanceCensus(page);
  const orphaned = await logOrphanedMasters(page);

  if (UNUSABLE.length) {
    log();
    log('--- ' + UNUSABLE.length + ' APPROVED TEMPLATE(S) THIS PLUGIN CANNOT USE');
    log(
      'Correct as app copy. Unusable only as a matcher, so nothing resolves through them.',
    );
    for (const entry of UNUSABLE) {
      log('  ' + (entry.key || '(no finalKey)') + '  ' + entry.ar);
      log('        ' + entry.why);
    }
  }

  logDump(buckets, slotGaps);

  await logOverflow(
    resolved,
    'PREDICTED OVERFLOW, measured against the real English',
    true,
    fonts.blocked,
  );

  // After the run, so it states what was found; includes the orphan count since no button ever fixes those.
  setVerdict(
    'VERDICT · ' +
      counts.arabic +
      ' Arabic layer(s): ' +
      (counts.approved + counts.template + counts.mockup) +
      ' have English, ' +
      counts.keep +
      ' held by instruction, ' +
      undrafted +
      ' with no English anywhere' +
      (orphaned ? ', ' + orphaned + ' on a DELETED master' : '') +
      ' — ' +
      (undrafted
        ? 'draft those before building'
        : orphaned
          ? 'nothing is written by this button; ' +
            orphaned +
            ' instance(s) need a master by hand first'
          : 'nothing is written by this button; this page is ready to build'),
  );
}

// Horizontal opposites among the `Icons` set's 310 variants — an exact list, not a heuristic, since the set ships both halves of each pair.
const DIR_PAIRS = (() => {
  const pairs = {
    'chevron-left': 'chevron-right',
    'chevrons-left': 'chevrons-right',
    'arrow-left': 'arrow-right',
    'arrow-left-circle': 'arrow-right-circle',
    'arrow-up-left': 'arrow-up-right',
    'arrow-down-left': 'arrow-down-right',
    'corner-up-left': 'corner-up-right',
    'corner-down-left': 'corner-down-right',
    'corner-left-up': 'corner-right-up',
    'corner-left-down': 'corner-right-down',
    'skip-back': 'skip-forward',
    'align-left': 'align-right',
  };

  const both = {};
  for (const key of Object.keys(pairs)) {
    both[key] = pairs[key];
    both[pairs[key]] = key;
  }
  return both;
})();

// Fallback for what can't variant-swap; word-boundaried since /back/ matches "Background", and length-capped since some "matches" are prose paragraphs, not layer names.
const DIR_NAME = /(^|[^a-z])(chevrons?|arrow|back|forward|next|prev)([^a-z]|$)/i;
const VERTICAL_NAME = /(up|down|top|bottom)/i;
const NOT_DIRECTIONAL = /(toggle|thumbs|trending|upload|download|phone|background)/i;
const NAME_LIMIT = 40;

function looksDirectional(name) {
  if (!name || name.length > NAME_LIMIT) return false;
  if (NOT_DIRECTIONAL.test(name)) return false;
  if (VERTICAL_NAME.test(name)) return false;
  return DIR_NAME.test(name);
}

function swapAlign(value) {
  if (value === 'MIN') return 'MAX';
  if (value === 'MAX') return 'MIN';
  return null;
}

/** Reflects a node about its own vertical centre; refuses a rotated node since the reflection math only holds without rotation. */
function flipHorizontally(node) {
  const matrix = node.relativeTransform;
  if (!matrix) return false;
  if (Math.abs(matrix[0][1]) > 0.001 || Math.abs(matrix[1][0]) > 0.001) return false;

  node.relativeTransform = [
    [-matrix[0][0], matrix[0][1], matrix[0][2] + node.width],
    [matrix[1][0], matrix[1][1], matrix[1][2]],
  ];
  return true;
}

/** Swaps a directional variant on an instance. Returns what changed, or null. */
function swapDirectionalVariant(node) {
  const properties = node.componentProperties;
  if (!properties) return null;

  for (const key of Object.keys(properties)) {
    const property = properties[key];
    if (property.type !== 'VARIANT') continue;

    const opposite = DIR_PAIRS[property.value];
    if (!opposite) continue;

    try {
      const next = {};
      next[key] = opposite;
      node.setProperties(next);
      return { ok: true, note: key + '=' + property.value + ' -> ' + opposite };
    } catch (error) {
      // Reported as a failure object, not a plain string, so the name-flip fallback still gets its turn.
      return {
        ok: false,
        note: 'could not swap ' + key + '=' + property.value + ': ' + messageOf(error),
      };
    }
  }

  return null;
}

/** err.message is the diagnosis; a Figma stack is often printed without it. */
function messageOf(error) {
  if (!error) return 'unknown error';
  return error.message || String(error);
}

/** Strips a variant property prefix, so `Type=chevron-left` reads as `chevron-left`. */
function variantName(name) {
  const at = String(name || '').lastIndexOf('=');
  return at === -1 ? String(name || '') : String(name).slice(at + 1);
}

/** A master's own relativeTransform is canvas position, not content direction, so flipping it would move the master and mirror nothing. */
function nameFlippable(node) {
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') return false;
  return looksDirectional(node.name);
}

// Names, not keys, since the swap target is always the LOCAL `Icons` set; scoped to arrows/chevrons/carets since a heart or person glyph has no direction to mirror.
const SWAP_PAIRS = (() => {
  const pairs = {
    'arrow-right': 'arrow-left',
    'chevron-right': 'chevron-left',
    'caret-right': 'caret-left',
  };

  const both = {};
  for (const key of Object.keys(pairs)) {
    both[key] = pairs[key];
    both[pairs[key]] = key;
  }
  return both;
})();

// Capped at 3 writes per run since whether a transform flip survives an auto-layout parent has no offline equivalent to test first.
const FLIP_LIMIT = 3;

/** Looks past an instance boundary without writing structure into it — only relativeTransform/swapComponent on the instance itself is ever permitted there, after Figma once rolled back 45 components for violating that. */
function directionalCandidatesUnder(root) {
  const found = [];
  const stack = (root.children || []).slice();

  while (stack.length) {
    const node = stack.pop();
    if (node.type === 'INSTANCE' && looksDirectional(node.name)) found.push(node);
    for (const child of node.children || []) stack.push(child);
  }

  return found;
}

/** x, y, width, height and the transform, for the before/after a swap is judged on. */
function geometryOf(node) {
  const matrix = node.relativeTransform || [
    [0, 0, 0],
    [0, 0, 0],
  ];

  return {
    x: round(node.x),
    y: round(node.y),
    width: round(node.width),
    height: round(node.height),
    scaleX: round(matrix[0][0]),
    tx: round(matrix[0][2]),
  };
}

function geometryLine(box) {
  return (
    'x=' +
    box.x +
    ' y=' +
    box.y +
    ' w=' +
    box.width +
    ' h=' +
    box.height +
    ' scaleX=' +
    box.scaleX +
    ' tx=' +
    box.tx
  );
}

let swapTargets = null;

/** Resolved once, lazily, only after a flip has failed — loading the masters page is an await under `documentAccess: dynamic-page`. */
async function resolveSwapTargets() {
  if (swapTargets) return swapTargets;

  swapTargets = new Map();

  for (const page of figma.root.children) {
    if (page.loadAsync) await page.loadAsync();

    const masters = page.findAllWithCriteria
      ? page.findAllWithCriteria({ types: ['COMPONENT'] })
      : [];

    if (!masters.length) continue;

    for (const master of masters) {
      const bare = variantName(master.name);
      if (SWAP_PAIRS[bare] && !swapTargets.has(bare)) {
        swapTargets.set(bare, { node: master, page: page.name });
      }
    }
  }

  return swapTargets;
}

/** Order per node: variant swap -> transform flip, read back -> component swap; reports every outcome since neither mechanism can be assumed to hold. */
async function flipDirectionals(candidates, changes) {
  const rows = [];
  let written = 0;

  for (const node of candidates) {
    if (written >= FLIP_LIMIT) {
      rows.push({ node, mechanism: 'capped' });
      continue;
    }

    const row = { node, parent: node.parent, before: geometryOf(node) };

    try {
      // A directional VARIANT swaps exactly and is legal on an instance since it changes no structure.
      const swapped = swapDirectionalVariant(node);

      if (swapped && swapped.ok) {
        row.mechanism = 'variant';
        row.note = swapped.note;
        changes.push({ kind: 'variant', note: '"' + node.name + '" ' + swapped.note });
        rows.push(row);
        written += 1;
        continue;
      }

      if (swapped) row.variantRefusal = swapped.note;

      // Flip, then read it back — a positive scaleX means the write didn't take.
      row.mechanism = 'transform';
      const flipped = flipHorizontally(node);
      row.after = geometryOf(node);
      row.survived = flipped && row.after.scaleX < 0;

      if (row.survived) {
        changes.push({ kind: 'flip', note: '"' + node.name + '" flipped by name match' });
        rows.push(row);
        written += 1;
        continue;
      }

      row.whyNot = flipped
        ? 'the matrix read back unflipped, so the parent recomputed it'
        : 'the node is rotated, so a reflection would corrupt its transform';

      // Fall back to the pair; a silently resized icon set is worse than a wrong-pointing arrow.
      const targets = await resolveSwapTargets();
      const want = SWAP_PAIRS[variantName(node.name)];
      const target = want ? targets.get(want) : null;

      if (!target) {
        row.mechanism = 'none';
        row.whyNot += '; and no local "' + want + '" exists to swap to';
        rows.push(row);
        continue;
      }

      node.swapComponent(target.node);
      row.mechanism = 'swap';
      row.swappedTo = want;
      row.fromPage = target.page;
      row.after = geometryOf(node);
      changes.push({
        kind: 'swap',
        note: '"' + node.name + '" swapped to ' + want,
      });
      written += 1;
    } catch (error) {
      row.mechanism = 'threw';
      row.error = messageOf(error);
    }

    rows.push(row);
  }

  return { rows, written };
}

/** Instances whose master was deleted — its own bucket, never folded into "left in Arabic", since neither twinning nor mirroring can fix a node with no master to write to. */
async function logOrphanedMasters(page) {
  const instances = page.findAllWithCriteria({ types: ['INSTANCE'] });
  const groups = new Map();

  for (const node of instances) {
    let main = null;

    try {
      main = await node.getMainComponentAsync();
    } catch (error) {
      main = null;
    }

    // A remote master is reported elsewhere; this bucket is only masters that are GONE.
    if (main && (main.remote || pageOf(main))) continue;

    const name = main ? main.name : '(unresolvable)';
    const group = groups.get(name) || [];
    group.push(node);
    groups.set(name, group);
  }

  if (!groups.size) return 0;

  let total = 0;
  for (const group of groups.values()) total += group.length;

  // Paid for only when there is something to report, because it loads every page.
  const mastersPage = await findMastersPage();
  const live = new Map();

  if (mastersPage) {
    for (const master of mastersOn(mastersPage)) {
      if (master.type !== 'COMPONENT') continue;
      const parent = master.parent;
      const label =
        parent && parent.type === 'COMPONENT_SET'
          ? parent.name + ' / ' + master.name
          : master.name;
      const stem = (
        parent && parent.type === 'COMPONENT_SET' ? parent.name : master.name
      ).split('/')[0];
      const list = live.get(stem) || [];
      if (list.indexOf(label) === -1) list.push(label);
      live.set(stem, list);
    }
  }

  log();
  log(
    '--- ORPHANED MASTERS · ' +
      total +
      ' instance(s) whose master was DELETED from this file',
  );
  log(
    'Neither twinnable nor mirrorable: there is no master node to clone or to write to, so',
  );
  log(
    'these stay in Arabic direction on the English page. Choosing a live variant for each is',
  );
  log(
    'a design decision AND a write to the Arabic page, so the plugin reports and does not act.',
  );

  for (const [name, group] of [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    const stem = name.split('/')[0];
    const options = live.get(stem) || [];

    log();
    log('  "' + name + '" · ' + group.length + ' instance(s)');
    if (options.length) {
      log('    live variants of the same family you could swap to:');
      for (const option of options) log('        ' + option);
    } else {
      log(
        '    no live master of that family remains, so this one needs drawing, not swapping',
      );
    }
    for (const node of group) {
      // The path without the page, since the heading already says which page this is.
      const path = pathOf(node).split(' › ').slice(1).join(' › ');
      log('    ' + path);
    }
  }

  return total;
}

/** The 30 most frequent instance names, resolved via getMainComponentAsync and printed with their SOURCE — layer name matches the main component's for only 315 of 1,375 instances on Expert 2, which is how 89 arrows went invisible to the matcher. */
async function logInstanceCensus(page) {
  const instances = page.findAllWithCriteria({ types: ['INSTANCE'] });
  const nested = new Set();

  for (const node of instances) {
    for (const under of node.findAllWithCriteria
      ? node.findAllWithCriteria({ types: ['INSTANCE'] })
      : []) {
      nested.add(under.id);
    }
  }

  const rows = new Map();

  for (const node of instances) {
    let main = null;

    try {
      main = await node.getMainComponentAsync();
    } catch (error) {
      main = null;
    }

    const mainName = main ? main.name : '(not in this file)';
    const key = node.name + '\u0000' + mainName + '\u0000' + (main ? !!main.remote : '?');
    const row = rows.get(key) || { count: 0, reach: 0, directional: false };

    row.count += 1;
    if (!nested.has(node.id)) row.reach += 1;
    row.directional = looksDirectional(node.name);
    rows.set(key, row);
  }

  log();
  log(
    '--- INSTANCES · ' +
      instances.length +
      ' on this page, ' +
      (instances.length - nested.size) +
      ' the mirror walk reaches, ' +
      nested.size +
      ' below a boundary',
  );
  log(
    'Names resolved through getMainComponentAsync. "layer" is what the name matcher sees;',
  );
  log('"main" is the master. Where they differ, only the layer name is matched on.');
  log('  count reach  layer                      main                       source');

  const sorted = [...rows.entries()].sort((a, b) => b[1].count - a[1].count);

  for (const [key, row] of sorted.slice(0, 30)) {
    const parts = key.split('\u0000');
    log(
      '  ' +
        pad(row.count, 5) +
        pad(row.reach, 6) +
        '  ' +
        (parts[0].length > 26 ? parts[0].slice(0, 25) + '…' : parts[0]).padEnd(26) +
        ' ' +
        (parts[1].length > 26 ? parts[1].slice(0, 25) + '…' : parts[1]).padEnd(26) +
        ' ' +
        (parts[0] === parts[1] ? 'same' : 'differs') +
        (parts[2] === 'true' ? ', remote' : parts[2] === 'false' ? ', local' : '') +
        (row.directional ? ', DIRECTIONAL' : ''),
    );
  }

  let candidates = 0;
  let reachable = 0;
  for (const row of rows.values()) {
    if (!row.directional) continue;
    candidates += row.count;
    reachable += row.reach;
  }

  log();
  log(
    '  DIRECTIONAL · ' +
      candidates +
      ' instance(s) the name matcher accepts, ' +
      reachable +
      ' of them reachable without descending',
  );

  if (candidates && !reachable) {
    log(
      '  Every one is below an instance boundary. Button 3 descends for these, and only',
    );
    log('  writes relativeTransform or swapComponent to them - never structure.');
  }
}

/** The gate's own section: three written, read back, and every other candidate named. */
function logDirectionals(result, candidates) {
  // Counted from the rows, not by subtracting written from candidates — "capped" and "tried but failed" are different things.
  let capped = 0;
  let attemptedAndFailed = 0;

  for (const row of result.rows) {
    if (row.mechanism === 'capped') capped += 1;
    else if (row.mechanism === 'none' || row.mechanism === 'threw')
      attemptedAndFailed += 1;
  }

  log();
  log(
    '--- DIRECTIONAL ICONS · ' +
      candidates.length +
      ' candidate(s) = ' +
      result.written +
      ' written + ' +
      attemptedAndFailed +
      ' could not be + ' +
      capped +
      ' left by the cap of ' +
      FLIP_LIMIT,
  );

  if (!candidates.length) {
    log('  none on this page.');
    return;
  }

  log(
    'Arrows and chevrons/carets only. heart and user are symmetric and deliberately out of scope.',
  );

  for (const row of result.rows) {
    if (row.mechanism === 'capped') continue;

    log('  ' + frameOf(row.node) + ' › "' + row.node.name + '"');
    log(
      '      parent        ' +
        (row.parent ? row.parent.type + ' "' + row.parent.name + '"' : '(none)') +
        ' layoutMode=' +
        ((row.parent && row.parent.layoutMode) || 'NONE'),
    );
    log('      before        ' + geometryLine(row.before));

    if (row.variantRefusal) log('      variant       ' + row.variantRefusal);

    if (row.mechanism === 'variant') {
      log('      MECHANISM     variant swap, exact: ' + row.note);
    } else if (row.mechanism === 'transform') {
      log('      after  (read) ' + geometryLine(row.after));
      log(
        row.survived
          ? '      MECHANISM     relativeTransform flip, and the mirror SURVIVED the read-back'
          : '      MIRROR DID NOT SURVIVE: ' + row.whyNot,
      );
    } else if (row.mechanism === 'swap') {
      log('      after  (read) ' + geometryLine(row.after));
      log(
        '      MECHANISM     component swap to "' +
          row.swappedTo +
          '" from page "' +
          row.fromPage +
          '"',
      );
      log('      transform flip was tried first: ' + row.whyNot);
    } else if (row.mechanism === 'none') {
      log('      NOTHING WRITTEN: ' + row.whyNot);
    } else if (row.mechanism === 'threw') {
      log('      THREW: ' + row.error);
    }
  }

  if (capped > 0) {
    const names = new Map();
    for (const row of result.rows) {
      if (row.mechanism !== 'capped') continue;
      names.set(row.node.name, (names.get(row.node.name) || 0) + 1);
    }

    log();
    log('  ' + capped + ' candidate(s) left untouched by the cap:');
    for (const entry of [...names.entries()].sort((a, b) => b[1] - a[1])) {
      log('      ' + pad(entry[1], 4) + 'x  ' + entry[0]);
    }
  }

  if (result.written) {
    log(
      '  Review the ' +
        result.written +
        ' written above on the canvas. The cap lifts only once that answer is in.',
    );
  } else if (candidates.length) {
    log(
      '  NOTHING was written. Neither mechanism worked here, and the reason is on each row.',
    );
    log(
      '  The floor is deliberate: a wrong-facing arrow is visible, a resized icon set is not.',
    );
  }
}

function flipByName(node, changes) {
  // A heuristic, so every one is reported for a human to check.
  if (flipHorizontally(node)) {
    changes.push({ kind: 'flip', note: '"' + node.name + '" flipped by name match' });
  } else {
    changes.push({
      kind: 'refused',
      note: '"' + node.name + '" matched the name list but is rotated, so left alone',
    });
  }
}

function mirrorOneNode(node, changes, keepTextAlign, unreachable) {
  // An instance gets its variant swapped and nothing else — writing its inherited layout here double-flips it.
  if (node.type === 'INSTANCE') {
    const swapped = swapDirectionalVariant(node);

    if (swapped && swapped.ok) {
      changes.push({ kind: 'variant', note: '"' + node.name + '" ' + swapped.note });
      return;
    }

    if (swapped) {
      changes.push({ kind: 'refused', note: '"' + node.name + '" ' + swapped.note });
    }
    if (!nameFlippable(node)) return;

    // An instance's own transform isn't structure, so this is legal even for a remote master — but skip one whose master was already mirrored, or it double-flips.
    if (!unreachable || unreachable.has(node.id)) flipByName(node, changes);
    return;
  }

  if (node.layoutMode === 'HORIZONTAL') {
    const children = node.children.slice();

    if (children.length > 1) {
      // appendChild moves a child it already owns, so appending in reverse reverses the row.
      for (let at = children.length - 1; at >= 0; at -= 1) node.appendChild(children[at]);
      changes.push({
        kind: 'row',
        note: 'reversed ' + children.length + ' children of "' + node.name + '"',
      });
    }

    const primary = swapAlign(node.primaryAxisAlignItems);
    if (primary) {
      changes.push({
        kind: 'axis',
        note:
          '"' +
          node.name +
          '" primary axis ' +
          node.primaryAxisAlignItems +
          ' -> ' +
          primary,
      });
      node.primaryAxisAlignItems = primary;
    }
  }

  if (node.layoutMode === 'VERTICAL') {
    const counter = swapAlign(node.counterAxisAlignItems);
    if (counter) {
      changes.push({
        kind: 'axis',
        note:
          '"' +
          node.name +
          '" counter axis ' +
          node.counterAxisAlignItems +
          ' -> ' +
          counter,
      });
      node.counterAxisAlignItems = counter;
    }
  }

  if (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL') {
    if (node.paddingLeft !== node.paddingRight) {
      const left = node.paddingLeft;
      changes.push({
        kind: 'padding',
        note:
          '"' + node.name + '" padding ' + left + '/' + node.paddingRight + ' swapped',
      });
      node.paddingLeft = node.paddingRight;
      node.paddingRight = left;
    }
  }

  if (node.type === 'TEXT' && node.textAlignHorizontal === 'RIGHT' && !keepTextAlign) {
    node.textAlignHorizontal = 'LEFT';
    changes.push({ kind: 'align', note: '"' + node.name + '" text align RIGHT -> LEFT' });
  }

  if (nameFlippable(node)) flipByName(node, changes);
}

/** Stops at every instance boundary and catches per node, since one escaping throw once made Figma roll back 45 components of correct work. */
function mirrorSubtree(root, changes, errors, unreachable, guard) {
  const stack = [root];
  let alreadyMirrored = 0;

  while (stack.length) {
    const node = stack.pop();

    // Outside the try, deliberately: a guard violation means the derivation points at the wrong page, not a bad node, so it must not be swallowed into `errors`.
    if (guard) guard(node);

    // Marked means a previous run already inverted this node; checked per node since a partial run can leave a master half-mirrored.
    if (node.getPluginData && node.getPluginData(MIRROR_KEY)) {
      alreadyMirrored += 1;
    } else {
      try {
        mirrorOneNode(node, changes, false, unreachable);
        // After the write, never before, so a node that throws stays unmarked for the next run to retry.
        if (node.setPluginData) node.setPluginData(MIRROR_KEY, MIRROR_MARK);
      } catch (error) {
        errors.push(
          '"' + (node.name || node.type) + '" (' + node.type + '): ' + messageOf(error),
        );
      }
    }

    if (node.type === 'INSTANCE') continue;

    for (const child of node.children || []) stack.push(child);
  }

  return alreadyMirrored;
}

/** Instances whose master isn't in this file — returns ids too, since the name-flip fallback must know whether a master could have been mirrored. */
async function masterlessOn(page) {
  const instances = page.findAllWithCriteria({ types: ['INSTANCE'] });
  const groups = new Map();
  const ids = new Set();

  for (const node of instances) {
    let main = null;

    try {
      main = await node.getMainComponentAsync();
    } catch (error) {
      main = null;
    }

    if (main && !main.remote) continue;

    ids.add(node.id);
    const label = main ? 'remote library: ' + main.name : 'master deleted';
    groups.set(label, (groups.get(label) || 0) + 1);
  }

  return { groups, ids };
}

// D-FIG-3: mirroring an Arabic master in place destroys the Arabic frame too (masters are shared across pages), so English lives on its own TWIN page, re-derived from the source rather than hand-authored.
const TWIN_PAGE_NAME = '\u{1F501} Components · LTR';

// The suffix goes on the TWIN'S OWN NAME and nowhere else. See assertNoInternalRename.
const TWIN_SUFFIX = ' · ltr';

/** On the Arabic SOURCE: the twin's id — Button 3 resolves variants by matching properties inside the twin set, not by following this link. */
const TWIN_KEY = 'wk-ltr-twin';

/** On the TWIN clone unit: where it came from, and the two hashes that detect drift. */
const SOURCE_ID_KEY = 'wk-rtl-source';
const SOURCE_HASH_KEY = 'wk-source-hash';
const TWIN_HASH_KEY = 'wk-twin-hash';

// Per-variant source hashes, so a stale twin can say WHICH variant moved, not just that something did.
const SOURCE_VARIANTS_KEY = 'wk-source-variants';

function variantHashes(unit) {
  const map = {};
  for (const variant of variantsOf(unit)) map[variant.name] = layoutHash(variant);
  return map;
}

function readVariantHashes(node) {
  const raw = node.getPluginData(SOURCE_VARIANTS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

// Stored hashes carry their producing version, so a scheme change reports once instead of as 60 false "source moved" mismatches. v2 dropped root translation: canvas position isn't layout.
const HASH_VERSION = 'v2';

function stampedHash(node) {
  return HASH_VERSION + ':' + layoutHash(node);
}

/** Why a stored hash does not match, in words a report can print. */
function hashVerdict(stored, current) {
  if (!stored) return 'no hash was stored';
  if (stored.indexOf(HASH_VERSION + ':') !== 0) {
    return 'the hash scheme changed to ' + HASH_VERSION + ', not the source';
  }
  return stored === current ? null : 'its source moved';
}

// Why a variant exists — mirrored (mirror changes it), host (carries a twin inside), or rider (neither, just cloned along) — stored per variant since a cloned set holds all three at once.
const TWIN_KIND_KEY = 'wk-twin-kind';
const KIND_MIRRORED = 'mirrored';
const KIND_HOST = 'host';
const KIND_RIDER = 'rider';

/** Marks the page notice, so no walk over the twin page mistakes it for a master. */
const BANNER_KEY = 'wk-twin-banner';

const TWIN_NOTICE =
  'DERIVED PAGE - DO NOT HAND-EDIT. Every component here is generated from its Arabic ' +
  'master by the Waha KUN English Frames plugin, Button 2. An edit made here is lost the ' +
  'next time the twin is re-derived, and it makes the twin disagree with its source without ' +
  'saying so. To change a twin, change the ARABIC master and re-run Button 2. To find drift, ' +
  'run Button 5.';

/** The chain from page to node, for an error that has to be actionable on the canvas. */
function pathOf(node) {
  const parts = [];
  let current = node;

  while (current) {
    parts.unshift(current.name || current.type);
    if (current.type === 'PAGE') break;
    current = current.parent;
  }

  return parts.join(' › ');
}

/** Stops at each instance boundary exactly as mirrorSubtree does; walking through once double-counted nodes across instances (92 where the mirror sees 53). */
function nodesToInstanceBoundary(root) {
  const found = [];
  const stack = [root];

  while (stack.length) {
    const node = stack.pop();
    found.push(node);

    if (node.type === 'INSTANCE') continue;
    for (const child of node.children || []) stack.push(child);
  }

  return found;
}

/** Some properties (layoutSizingHorizontal outside auto-layout, usually) throw instead of returning undefined, which would void a whole hash derivation. */
function readLayout(node, key, fallback) {
  try {
    const value = node[key];
    return value === undefined || value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

/** Simulates mirrorOneNode over the subtree, never inferring from node type, so each branch here pairs exactly with a branch there — layoutPositioning ABSOLUTE is deliberately excluded since the mirror never repositions one. */
function mirrorWouldChange(master) {
  const hits = { row: 0, axis: 0, padding: 0, align: 0, directional: 0 };

  for (const node of nodesToInstanceBoundary(master)) {
    // An instance takes a variant swap or a transform flip and nothing else.
    if (node.type === 'INSTANCE') {
      if (nameFlippable(node)) hits.directional += 1;
      continue;
    }

    const horizontal = node.layoutMode === 'HORIZONTAL';
    const vertical = node.layoutMode === 'VERTICAL';

    // ALL children, not just visible ones — hidden children still affect document child order.
    if (horizontal && (node.children || []).length > 1) hits.row += 1;

    // HORIZONTAL swaps the PRIMARY axis, VERTICAL the COUNTER; swapAlign only moves MIN<->MAX.
    if (horizontal && swapAlign(node.primaryAxisAlignItems)) hits.axis += 1;
    if (vertical && swapAlign(node.counterAxisAlignItems)) hits.axis += 1;

    if ((horizontal || vertical) && node.paddingLeft !== node.paddingRight)
      hits.padding += 1;

    // RIGHT only, matching mirrorOneNode — a LEFT-aligned layer in RTL is usually a 6.7 LTR island that must not flip.
    if (node.type === 'TEXT' && node.textAlignHorizontal === 'RIGHT') hits.align += 1;

    if (nameFlippable(node)) hits.directional += 1;
  }

  return hits;
}

function isTwinCandidate(master) {
  const hits = mirrorWouldChange(master);
  return hits.row + hits.axis + hits.padding + hits.align + hits.directional > 0;
}

/** Two 32-bit accumulators, not one — there's no crypto in the Figma sandbox, and a single 32-bit hash over 6,000 nodes gets uncomfortably close to the birthday bound. */
function hashString(text) {
  let fnv = 0x811c9dc5;
  let djb = 5381;

  for (let at = 0; at < text.length; at += 1) {
    const code = text.charCodeAt(at);
    fnv = (fnv ^ code) >>> 0;
    fnv = (fnv + ((fnv << 1) + (fnv << 4) + (fnv << 7) + (fnv << 8) + (fnv << 24))) >>> 0;
    djb = (((djb << 5) + djb) ^ code) >>> 0;
  }

  const hex = value => ('00000000' + value.toString(16)).slice(-8);
  return hex(fnv) + hex(djb);
}

/** Layout-relevant properties as one line — text/fills are deliberately absent so copy changes don't mark a twin stale, node ids are absent since a clone always gets fresh ones, and the root's transform keeps only its linear part since canvas position isn't layout. */
function layoutSignature(node, atRoot) {
  const transform = readLayout(node, 'relativeTransform', null);
  const rounded = transform
    ? transform
        .map(row =>
          (atRoot ? row.slice(0, 2) : row).map(value => Math.round(value * 1000) / 1000),
        )
        .join(';')
    : '';

  return [
    node.type,
    node.name,
    readLayout(node, 'componentId', ''),
    readLayout(node, 'layoutMode', 'NONE'),
    readLayout(node, 'primaryAxisAlignItems', 'MIN'),
    readLayout(node, 'counterAxisAlignItems', 'MIN'),
    readLayout(node, 'paddingLeft', 0),
    readLayout(node, 'paddingRight', 0),
    readLayout(node, 'paddingTop', 0),
    readLayout(node, 'paddingBottom', 0),
    readLayout(node, 'itemSpacing', 0),
    readLayout(node, 'layoutPositioning', 'AUTO'),
    readLayout(node, 'layoutSizingHorizontal', ''),
    readLayout(node, 'layoutWrap', ''),
    readLayout(node, 'visible', true) ? 'visible' : 'hidden',
    node.type === 'TEXT' ? readLayout(node, 'textAlignHorizontal', 'LEFT') : '',
    rounded,
  ].join('\u0001');
}

/** Recursed in document order through every variant, NOT boundary-stopped (unlike the candidate test) — an instance's own overrides are part of what moved. */
function layoutHash(root) {
  const lines = [];

  (function walk(node, depth) {
    lines.push(depth + '|' + layoutSignature(node, depth === 0));
    const children = node.children || [];
    for (let at = 0; at < children.length; at += 1) walk(children[at], depth + 1);
  })(root, 0);

  return hashString(lines.join('\n'));
}

/** Clones the whole COMPONENT_SET, not just the variant, so Button 3's variant-to-variant mapping stays total — non-candidate variants ride along as "riders". */
function cloneUnitOf(master) {
  const parent = master.parent;
  return parent && parent.type === 'COMPONENT_SET' ? parent : master;
}

/** Every variant of a clone unit; a standalone component is its own single variant. */
function variantsOf(unit) {
  return unit.type === 'COMPONENT_SET' ? unit.children.slice() : [unit];
}

/** For each master, the masters it instantiates at its own boundary only — a deeper instance belongs to the master above it. Async since `mainComponent` isn't synchronously available under `documentAccess: dynamic-page`. */
async function masterDependencyGraph(masters) {
  const edges = new Map();
  const byId = new Map();
  for (const master of masters) byId.set(master.id, master);

  for (const master of masters) {
    const targets = new Set();

    for (const node of nodesToInstanceBoundary(master)) {
      if (node.type !== 'INSTANCE') continue;

      let main = null;
      try {
        main = await node.getMainComponentAsync();
      } catch (error) {
        main = null;
      }

      // A remote or deleted master is a leaf by necessity — nothing in this file to clone.
      if (main && byId.has(main.id)) targets.add(main.id);
    }

    edges.set(master.id, targets);
  }

  return { edges, byId };
}

/** Twin M if mirroring changes M, OR if M transitively hosts a twin — otherwise the rewire pass can't reach instances nested inside an untwinned host, and they'd render right-to-left behind a correct-looking top level. */
function twinSetFor(scope, edges, candidates) {
  const twins = new Set();
  for (const id of scope) if (candidates.has(id)) twins.add(id);

  const hostOf = new Map();
  let added = 1;
  let rounds = 0;

  while (added > 0) {
    added = 0;
    rounds += 1;

    for (const id of scope) {
      if (twins.has(id)) continue;

      for (const target of edges.get(id) || []) {
        if (!twins.has(target)) continue;
        twins.add(id);
        hostOf.set(id, target);
        added += 1;
        break;
      }
    }
  }

  return { twins, hostOf, rounds };
}

let twinPage = null;

/** Refuses any write to a node not on the twin page, checked at the write site rather than the caller — throws rather than silently skipping, since a silent skip would present as a clean derivation. */
function assertOnTwinPage(node, what) {
  const page = pageOf(node);
  if (twinPage && page && page.id === twinPage.id) return;

  throw new Error(
    'REFUSED ' +
      what +
      ' on "' +
      pathOf(node) +
      '" - page "' +
      (page ? page.name : '(detached)') +
      '" is not the twin page. An Arabic master is never written to. This is a bug in the ' +
      'twin derivation, not a condition to handle.',
  );
}

/** PageNode has no `description` property, so the notice is served two ways: relaunch data in the properties panel, and a locked, stamped banner on the canvas. */
async function ensureTwinPage() {
  if (twinPage) return twinPage;

  for (const page of figma.root.children) {
    if (page.name !== TWIN_PAGE_NAME) continue;
    if (page.loadAsync) await page.loadAsync();
    twinPage = page;
    break;
  }

  if (!twinPage) {
    twinPage = figma.createPage();
    twinPage.name = TWIN_PAGE_NAME;
  }

  // Idempotent — the key is read before anything is created, so a second run doesn't duplicate the banner.
  if (twinPage.setRelaunchData) twinPage.setRelaunchData({ check: TWIN_NOTICE });

  const existing = twinPage.findOne
    ? twinPage.findOne(node => !!(node.getPluginData && node.getPluginData(BANNER_KEY)))
    : null;

  if (!existing) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    const banner = figma.createText();
    banner.fontName = { family: 'Inter', style: 'Regular' };
    banner.fontSize = 18;
    banner.characters = TWIN_NOTICE;
    banner.name = 'DERIVED - DO NOT HAND-EDIT';
    banner.x = 0;
    banner.y = -160;
    banner.resize(1200, banner.height);
    banner.setPluginData(BANNER_KEY, 'd-fig-3');
    banner.locked = true;
    twinPage.appendChild(banner);
  }

  return twinPage;
}

/** A node the twin page owns but which is not a master, so derivation steps over it. */
function isTwinBanner(node) {
  return !!(node.getPluginData && node.getPluginData(BANNER_KEY));
}

/** Leaves first, so a leaf's twin already exists when something instantiating it is cloned (the rewire pass still runs regardless); iterative with three colours so a cycle comes back as a named, skipped path, not a blown stack. */
function topologicalOrder(scope, edges) {
  const colour = new Map();
  const order = [];
  const cycles = [];

  for (const root of scope) {
    if (colour.get(root)) continue;

    colour.set(root, 'GREY');
    const stack = [{ id: root, at: 0, path: [root] }];

    while (stack.length) {
      const frame = stack[stack.length - 1];
      const targets = [...(edges.get(frame.id) || [])].filter(id => scope.has(id));

      if (frame.at >= targets.length) {
        colour.set(frame.id, 'BLACK');
        order.push(frame.id);
        stack.pop();
        continue;
      }

      const target = targets[frame.at];
      frame.at += 1;
      const seen = colour.get(target);

      if (seen === 'GREY') {
        cycles.push(frame.path.slice(frame.path.indexOf(target)).concat([target]));
        continue;
      }
      if (seen === 'BLACK') continue;

      colour.set(target, 'GREY');
      stack.push({ id: target, at: 0, path: frame.path.concat([target]) });
    }
  }

  const inCycle = new Set();
  for (const cycle of cycles) for (const id of cycle) inCycle.add(id);

  return { order: order.filter(id => !inCycle.has(id)), cycles, inCycle };
}

/** Matched by variant name exactly (cloning preserves it, and renaming inside a twin is forbidden); returns null rather than guessing by index when nothing matches. */
function twinVariantFor(sourceMaster, twinUnit) {
  if (twinUnit.type !== 'COMPONENT_SET') return twinUnit;
  for (const variant of twinUnit.children) {
    if (variant.name === sourceMaster.name) return variant;
  }
  return null;
}

/** PASS A — derives a twin for every clone unit, leaves first, idempotent by source hash (replaced wholesale, never patched); wk-twin-hash is stamped later, after the rewire pass changes the twin. */
async function deriveTwins(scope, edges, candidates, twins, hostOf, byId) {
  const page = await ensureTwinPage();
  const { order, cycles, inCycle } = topologicalOrder(scope, edges);

  // Clone units in first-appearance order; a unit derives once regardless of how many variants are in the twin set.
  const unitsInOrder = [];
  const seenUnits = new Set();
  for (const id of order) {
    if (!twins.has(id)) continue;
    const unit = cloneUnitOf(byId.get(id));
    if (seenUnits.has(unit.id)) continue;
    seenUnits.add(unit.id);
    unitsInOrder.push(unit);
  }

  // The four outcomes are disjoint and sum to the unit count — `created`/`rederived` once shared a bucket+flag and double-counted a unit.
  const result = {
    cycles,
    skippedForCycle: [...inCycle].filter(id => twins.has(id)),
    created: [],
    rederived: [],
    skipped: [],
    failed: [],
    twinOfUnit: new Map(),
    twinOfMaster: new Map(),
    errors: [],
    changes: [],
    marksCleared: 0,
  };

  for (const unit of unitsInOrder) {
    const sourceHash = stampedHash(unit);
    const existingId = unit.getPluginData(TWIN_KEY);
    let existing = null;

    if (existingId) {
      try {
        existing = await figma.getNodeByIdAsync(existingId);
      } catch (error) {
        existing = null;
      }
    }

    const why = existing
      ? hashVerdict(existing.getPluginData(SOURCE_HASH_KEY), sourceHash)
      : 'there is no twin yet';

    if (existing && !why) {
      result.skipped.push(unit.name);
      result.twinOfUnit.set(unit.id, existing);
      for (const variant of variantsOf(unit)) {
        const paired = twinVariantFor(variant, existing);
        if (paired) result.twinOfMaster.set(variant.id, paired);
      }
      continue;
    }

    const wasStale = !!existing;

    try {
      // A stale twin is removed before the new one is appended, so it can't outlive its replacement under a near-identical name.
      if (existing) existing.remove();

      const clone = unit.clone();
      page.appendChild(clone);

      // The twin's own name may change freely, but renaming any layer or variant INSIDE it silently drops Button 3's text overrides on swapComponent — so only this line touches `.name`.
      clone.name = unit.name + TWIN_SUFFIX;

      // A clone inherits its source's plugin data; an inherited mirror mark would make mirrorSubtree skip every node.
      result.marksCleared += clearInheritedMarks(clone);

      mirrorSubtree(clone, result.changes, result.errors, null, node =>
        assertOnTwinPage(node, 'a mirror write during twin derivation'),
      );

      clone.setPluginData(SOURCE_ID_KEY, unit.id);
      clone.setPluginData(SOURCE_HASH_KEY, sourceHash);
      clone.setPluginData(SOURCE_VARIANTS_KEY, JSON.stringify(variantHashes(unit)));
      unit.setPluginData(TWIN_KEY, clone.id);

      for (const variant of variantsOf(unit)) {
        const paired = twinVariantFor(variant, clone);
        if (!paired) {
          result.errors.push(
            'no twin variant matched "' + variant.name + '" inside "' + clone.name + '"',
          );
          continue;
        }

        result.twinOfMaster.set(variant.id, paired);
        paired.setPluginData(
          TWIN_KIND_KEY,
          candidates.has(variant.id)
            ? KIND_MIRRORED
            : hostOf.has(variant.id)
              ? KIND_HOST
              : KIND_RIDER,
        );
      }

      result.twinOfUnit.set(unit.id, clone);
      // The TWIN's name, never the source's, in both buckets — a re-derived unit also carries WHY.
      if (wasStale) result.rederived.push({ name: clone.name, why });
      else result.created.push(clone.name);
    } catch (error) {
      result.failed.push(unit.name + ': ' + messageOf(error));
    }
  }

  return result;
}

/** PASS B — points every instance inside a twin at the twin of its own master; without this a twin mirrors at the top level but renders RTL two levels down. Boundary instances only — a nested instance's master was already rewired as its own twin. */
async function rewireNestedInstances(twinUnits, twinOfMaster) {
  const result = {
    rewired: 0,
    unitsTouched: 0,
    noTwin: 0,
    remote: 0,
    orphan: 0,
    failed: [],
  };

  for (const unit of twinUnits) {
    let touched = false;

    for (const variant of variantsOf(unit)) {
      for (const node of nodesToInstanceBoundary(variant)) {
        if (node.type !== 'INSTANCE' || node === variant) continue;

        let main = null;
        try {
          main = await node.getMainComponentAsync();
        } catch (error) {
          main = null;
        }

        if (!main) {
          result.orphan += 1;
          continue;
        }
        if (main.remote) {
          result.remote += 1;
          continue;
        }

        const target = twinOfMaster.get(main.id);
        if (!target) {
          result.noTwin += 1;
          continue;
        }

        try {
          assertOnTwinPage(node, 'a swapComponent during the rewire pass');
          node.swapComponent(target);
          result.rewired += 1;
          touched = true;
        } catch (error) {
          result.failed.push(pathOf(node) + ': ' + messageOf(error));
        }
      }
    }

    if (touched) result.unitsTouched += 1;
  }

  return result;
}

// A shelf pack, since clone() keeps frame-relative x/y that collapse into a heap once appended to the page root; sorted by name+id (a total order) so re-runs don't reshuffle the page.
const TWIN_ROW_WIDTH = 5000;
const TWIN_GAP = 160;

function layoutTwinPage(twinUnits) {
  const ordered = twinUnits.slice().sort((one, two) => {
    if (one.name !== two.name) return one.name < two.name ? -1 : 1;
    return one.id < two.id ? -1 : 1;
  });

  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let rows = ordered.length ? 1 : 0;
  let widest = 0;

  for (const unit of ordered) {
    const width = unit.width || 0;
    const height = unit.height || 0;

    if (x > 0 && x + width > TWIN_ROW_WIDTH) {
      y += rowHeight + TWIN_GAP;
      x = 0;
      rowHeight = 0;
      rows += 1;
    }

    unit.x = x;
    unit.y = y;

    x += width + TWIN_GAP;
    if (x > widest) widest = x;
    if (height > rowHeight) rowHeight = height;
  }

  return { rows, width: Math.max(0, widest - TWIN_GAP), height: y + rowHeight };
}

/** Taken LAST, after mirror/rewire/arrange, so Button 5's hand-edited check compares against what derivation actually produced, not a recomputed expectation that could drift. */
function stampTwinHashes(twinUnits) {
  for (const unit of twinUnits) unit.setPluginData(TWIN_HASH_KEY, stampedHash(unit));
}

/** Clears a mirror mark a clone inherited from its source — uncleared, mirrorSubtree would skip every node and the twin would come out unmirrored under a successful-looking report. */
function clearInheritedMarks(root) {
  let cleared = 0;
  const stack = [root];

  while (stack.length) {
    const node = stack.pop();
    if (node.getPluginData && node.getPluginData(MIRROR_KEY)) {
      node.setPluginData(MIRROR_KEY, '');
      cleared += 1;
    }
    for (const child of node.children || []) stack.push(child);
  }

  return cleared;
}

/** The twin of a master through its clone unit, or null — tolerates a master whose node was deleted (still resolves, but carries no plugin data), guarded here too so a throw can't take the whole per-instance loop with it. */
async function twinOf(master) {
  const unit = cloneUnitOf(master);
  if (!unit || typeof unit.getPluginData !== 'function') return null;

  const twinUnitId = unit.getPluginData(TWIN_KEY);
  if (!twinUnitId) return null;

  let twinUnit = null;
  try {
    twinUnit = await figma.getNodeByIdAsync(twinUnitId);
  } catch (error) {
    twinUnit = null;
  }
  // A pointer to a deleted twin — Button 5 reports it as an orphan; here it just means leave the instance alone.
  if (!twinUnit || twinUnit.removed) return null;

  return twinVariantFor(master, twinUnit);
}

/** Must run BEFORE the text pass — swapComponent overrides match by internal layer name, so text written first gets silently dropped on a swap (E2 paid for this order mistake once already). Boundary instances only. */
async function swapInstancesToTwins(page) {
  const result = { swapped: 0, noTwin: 0, remote: 0, orphan: 0, failed: [] };

  const boundary = [];
  const stack = page.children ? page.children.slice() : [];
  while (stack.length) {
    const node = stack.pop();
    if (node.type === 'INSTANCE') {
      boundary.push(node);
      continue;
    }
    for (const child of node.children || []) stack.push(child);
  }

  for (const instance of boundary) {
    let main = null;
    try {
      main = await instance.getMainComponentAsync();
    } catch (error) {
      main = null;
    }

    if (!main) {
      result.orphan += 1;
      continue;
    }
    // A remote master can't be cloned as a usable twin, so its instances keep the per-instance variant-swap path.
    if (main.remote) {
      result.remote += 1;
      continue;
    }
    // A deleted master's node resolves but sits on no page — counted apart from "no twin needed" since these are a hand job.
    if (!pageOf(main)) {
      result.orphan += 1;
      continue;
    }

    const target = await twinOf(main);
    if (!target) {
      result.noTwin += 1;
      continue;
    }

    try {
      instance.swapComponent(target);
      result.swapped += 1;
    } catch (error) {
      result.failed.push(
        frameOf(instance) + ' › "' + instance.name + '": ' + messageOf(error),
      );
    }
  }

  return result;
}

/** BUTTON 2 — builds LTR twins on their own page; assertOnTwinPage enforces at every write that the old in-place-mirror behavior (which corrupted the Arabic original) is unreachable, not just unintended. */
async function deriveTwinPage() {
  heading('BUILD THE LTR TWINS');

  const page = figma.currentPage;
  const onPage = mastersOn(page);
  const masters = onPage.filter(node => node.type === 'COMPONENT');

  if (!masters.length) {
    log('This page holds no master components, so there is nothing here to derive from.');
    log('Open the page your components live on and run it there.');
    setVerdict('VERDICT · REFUSED: this page holds no master components');
    return;
  }

  // Before the first write — the mirror's textAlignHorizontal write needs every existing face loaded; censused on the source page since a clone carries its faces exactly.
  const fonts = await prepareFonts(page);
  log();

  const byId = new Map(masters.map(master => [master.id, master]));
  const graph = await masterDependencyGraph(masters);

  // Scope: masters the two in-scope pages depend on — Admin, version-history and locked pages are out entirely.
  const scope = await dependencyScope(byId);
  const candidates = new Set([...scope].filter(id => isTwinCandidate(byId.get(id))));
  const closure = twinSetFor(scope, graph.edges, candidates);

  const derived = await deriveTwins(
    scope,
    graph.edges,
    candidates,
    closure.twins,
    closure.hostOf,
    byId,
  );

  const units = [];
  for (const unit of derived.twinOfUnit.values()) {
    if (units.indexOf(unit) === -1) units.push(unit);
  }

  const rewire = await rewireNestedInstances(units, derived.twinOfMaster);

  // Read off the page, not this run's results, so a twin whose source was deleted still gets arranged.
  const arranged = (await ensureTwinPage()).children.filter(
    node => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET',
  );
  const grid = layoutTwinPage(arranged);

  // LAST: after the mirror, after the rewire, and after the page is arranged.
  stampTwinHashes(units);

  reportTwinDerivation({
    page,
    scope,
    candidates,
    closure,
    derived,
    rewire,
    units,
    grid,
    arranged,
    blocked: fonts.blocked,
  });
}

/** Only these two pages — other Hi-Fi pages are version history, Admin is a separate codebase (SPEC §11), and locked pages are derivative; twinning them would put masters where no deliverable frame uses them. */
async function dependencyScope(byId) {
  const scope = new Set();

  for (const page of figma.root.children) {
    if (!IN_SCOPE_PAGES.test(page.name)) continue;
    // A built English page matches the name test too, but is excluded so scope stays a function of the Arabic design alone.
    if (isEnglishPage(page)) continue;
    if (page.loadAsync) await page.loadAsync();

    for (const instance of page.findAllWithCriteria({ types: ['INSTANCE'] })) {
      let main = null;
      try {
        main = await instance.getMainComponentAsync();
      } catch (error) {
        main = null;
      }
      if (main && byId.has(main.id)) scope.add(main.id);
    }
  }

  return scope;
}

/** Button 3 runs on these two pages only, so the twin set is scoped to what they use. */
const IN_SCOPE_PAGES = /Farmer 2|Expert 2/;

/** Tries the current page first (cheap, and where Button 2 usually runs) before paying for a twelve-page scan. */
async function findMastersPage() {
  if (mastersOn(figma.currentPage).length) return figma.currentPage;

  let best = null;
  let most = 0;

  for (const page of figma.root.children) {
    if (page.loadAsync) await page.loadAsync();
    if (!page.findAllWithCriteria) continue;
    const count = page.findAllWithCriteria({ types: ['COMPONENT'] }).length;
    if (count > most) {
      most = count;
      best = page;
    }
  }

  return best;
}

/** BUTTON 5 — read-only; checks stale/missing/orphaned/hand-edited, all invisible from the canvas alone. MISSING is scoped, or an unscoped check reports 106 false missing twins on its first run. */
async function checkTwins() {
  heading('CHECK TWINS');

  const twinPage = figma.root.children.filter(page => page.name === TWIN_PAGE_NAME)[0];

  if (!twinPage) {
    log('There is no "' + TWIN_PAGE_NAME + '" page, so no twin has ever been derived.');
    log('Run Button 2 on your components page first.');
    setVerdict('VERDICT · no twin page exists, so there is nothing to check');
    return;
  }

  if (twinPage.loadAsync) await twinPage.loadAsync();

  const mastersPage = await findMastersPage();
  if (!mastersPage) {
    log('No page in this file holds master components, so the scope cannot be computed.');
    setVerdict('VERDICT · REFUSED: no components page found');
    return;
  }

  const masters = mastersOn(mastersPage).filter(node => node.type === 'COMPONENT');
  const byId = new Map(masters.map(master => [master.id, master]));
  const scope = await dependencyScope(byId);
  const graph = await masterDependencyGraph(masters);
  const candidates = new Set([...scope].filter(id => isTwinCandidate(byId.get(id))));
  const closure = twinSetFor(scope, graph.edges, candidates);

  const units = twinPage.children.filter(
    node => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET',
  );

  log(
    'SCOPE · the masters the Hi-Fi Farmer 2 and Expert 2 pages depend on, ' +
      scope.size +
      ' of ' +
      masters.length +
      '.',
  );
  log('  A master outside that scope is not twinned, and that is not drift.');
  log('  Components page read: "' + mastersPage.name + '"');
  log();

  const stale = [];
  const orphaned = [];
  const handEdited = [];
  const rehashed = [];

  for (const unit of units) {
    const sourceId = unit.getPluginData(SOURCE_ID_KEY);
    let source = null;

    if (sourceId) {
      try {
        source = await figma.getNodeByIdAsync(sourceId);
      } catch (error) {
        source = null;
      }
    }

    if (!source || source.removed || !pageOf(source)) {
      orphaned.push(unit);
      continue;
    }

    // A hash-scheme change is reported apart from a hand edit — one's the plugin, the other's a human.
    const twinVerdict = hashVerdict(unit.getPluginData(TWIN_HASH_KEY), stampedHash(unit));
    if (twinVerdict && /scheme changed/.test(twinVerdict))
      rehashed.push({ unit, twinVerdict });
    else if (twinVerdict) handEdited.push({ unit, why: twinVerdict });

    // The source against what it was when the twin was derived.
    const sourceVerdict = hashVerdict(
      unit.getPluginData(SOURCE_HASH_KEY),
      stampedHash(source),
    );
    if (sourceVerdict && !/scheme changed/.test(sourceVerdict)) {
      const was = readVariantHashes(unit);
      const now = variantHashes(source);
      const moved = [];

      if (was) {
        for (const name of Object.keys(now)) {
          if (was[name] === undefined) moved.push(name + '  (new variant)');
          else if (was[name] !== now[name]) moved.push(name);
        }
        for (const name of Object.keys(was)) {
          if (now[name] === undefined) moved.push(name + '  (variant deleted)');
        }
      }

      stale.push({ unit, source, moved, known: !!was });
    }
  }

  // MISSING is over the scope, nothing wider.
  const missing = [];
  for (const id of closure.twins) {
    const master = byId.get(id);
    if (!master) continue;
    const twin = await twinOf(master);
    if (twin) continue;
    missing.push({
      master,
      why: candidates.has(id)
        ? 'the mirror changes it: ' + firedSources(master)
        : 'host-only: it carries a twin inside it',
    });
  }

  logTwinCheck({
    units,
    scope,
    closure,
    candidates,
    stale,
    missing,
    orphaned,
    handEdited,
    rehashed,
  });
}

/** Which asymmetry sources fire on a master, in words, for a MISSING row. */
function firedSources(master) {
  const hits = mirrorWouldChange(master);
  const names = [];
  if (hits.row) names.push('row reversal x' + hits.row);
  if (hits.axis) names.push('axis x' + hits.axis);
  if (hits.padding) names.push('padding x' + hits.padding);
  if (hits.align) names.push('text align x' + hits.align);
  if (hits.directional) names.push('directional icon x' + hits.directional);
  return names.join(', ') || 'nothing, which contradicts it being a candidate';
}

/** Every section prints its zero even when empty — a check that goes silent on passing is indistinguishable from one that never ran. */
function logTwinCheck(run) {
  const { units, closure, stale, missing, orphaned, handEdited, rehashed } = run;

  log(
    'TWINS ON THE PAGE · ' +
      units.length +
      ' clone unit(s), ' +
      closure.twins.size +
      ' master(s) in scope need one',
  );
  log();

  log('STALE · the source moved since derivation          ' + pad(stale.length, 6));
  for (const row of stale) {
    log('    ' + row.unit.name + '   source "' + row.source.name + '"');
    if (!row.known) {
      log(
        '        derived before per-variant hashes were stored, so which variant moved',
      );
      log('        is not recoverable - re-run Button 2 and it will be from then on');
    } else if (!row.moved.length) {
      log('        the unit hash moved but no variant did, which means the SET itself');
      log('        changed - a variant added or removed, or its own layout');
    } else {
      for (const name of row.moved) log('        moved: ' + name);
    }
  }

  log();
  log('MISSING · in scope, needs a twin, has none         ' + pad(missing.length, 6));
  for (const row of missing) {
    log('    ' + row.master.name + '   ' + row.why);
  }

  log();
  log("ORPHANED · the twin's source has been deleted      " + pad(orphaned.length, 6));
  for (const unit of orphaned) {
    // The id, because the source name is exactly what is no longer readable.
    log(
      '    ' +
        unit.name +
        '   [' +
        unit.id +
        ']  source id "' +
        (unit.getPluginData(SOURCE_ID_KEY) || '(none stored)') +
        '"',
    );
  }

  log();
  log('HAND-EDITED · the twin is not what derivation left ' + pad(handEdited.length, 6));
  for (const row of handEdited) {
    log('    ' + row.unit.name + '   ' + row.why);
    log('        A twin is DERIVED, never authored. Change the ARABIC master and re-run');
    log('        Button 2; an edit made here is lost at the next derivation.');
  }

  if (rehashed.length) {
    log();
    log('HASH SCHEME CHANGED · not drift                    ' + pad(rehashed.length, 6));
    log(
      '    The plugin changed what the hash covers, so these values predate it. Re-run',
    );
    log('    Button 2 once and they settle. None of these sources moved.');
  }

  // Ids only where a name is ambiguous, or printing one on all 60 rows makes the other 57 harder to read.
  const byName = new Map();
  for (const unit of units) byName.set(unit.name, (byName.get(unit.name) || 0) + 1);
  const collisions = units.filter(unit => byName.get(unit.name) > 1);

  if (collisions.length) {
    log();
    log('NAME COLLISIONS · ' + collisions.length + ' twin(s) share a name on this page');
    log(
      '  Harmless - ids are what resolve - but a name alone cannot tell you which is which.',
    );
    for (const unit of collisions.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      log('    ' + unit.name + '  [' + unit.id + ']');
    }
  }

  const drift = stale.length + missing.length + orphaned.length + handEdited.length;
  setVerdict(
    'VERDICT · ' +
      units.length +
      ' twin(s): ' +
      stale.length +
      ' stale, ' +
      missing.length +
      ' missing, ' +
      orphaned.length +
      ' orphaned, ' +
      handEdited.length +
      ' hand-edited' +
      (rehashed.length ? ', ' + rehashed.length + ' on an older hash scheme' : '') +
      ' — ' +
      (drift
        ? 'THERE IS DRIFT; the list is below'
        : rehashed.length
          ? 'no drift, but re-run Button 2 to settle the hash scheme'
          : 'no drift'),
  );
}

/** Prints both masters visible on the page and the number that needed a twin, since a reader with only the second number (155 vs. 243) will think the page is wrong. */
function reportTwinDerivation(run) {
  const { scope, candidates, closure, derived, rewire, units, grid, arranged } = run;

  const hosts = [...closure.twins].filter(id => !candidates.has(id));
  const setUnits = units.filter(unit => unit.type === 'COMPONENT_SET').length;

  let riders = 0;
  const kinds = { mirrored: 0, host: 0, rider: 0, unmarked: 0 };
  for (const unit of units) {
    for (const variant of variantsOf(unit)) {
      const kind = variant.getPluginData(TWIN_KIND_KEY);
      if (kind === KIND_MIRRORED) kinds.mirrored += 1;
      else if (kind === KIND_HOST) kinds.host += 1;
      else if (kind === KIND_RIDER) {
        kinds.rider += 1;
        riders += 1;
      } else kinds.unmarked += 1;
    }
  }
  const onTwinPage = kinds.mirrored + kinds.host + kinds.rider + kinds.unmarked;

  log('TWIN PAGE · ' + TWIN_PAGE_NAME);
  log('  scope: the masters the Hi-Fi Farmer 2 and Expert 2 pages depend on.');
  log('  A master outside that scope is not twinned and is not drift.');
  log();
  log('  masters in scope                            ' + pad(scope.size, 6));
  log('  twin needed                                 ' + pad(closure.twins.size, 6));
  log('      mirroring changes the master            ' + pad(candidates.size, 6));
  log('      host-only, carries a twin inside it     ' + pad(hosts.length, 6));
  log(
    '  no twin needed                              ' +
      pad(scope.size - closure.twins.size, 6),
  );
  log();
  log('  CLONE UNITS                                 ' + pad(units.length, 6));
  log('      component set(s)                        ' + pad(setUnits, 6));
  log('      standalone component(s)                 ' + pad(units.length - setUnits, 6));
  log('      non-candidate variants riding along     ' + pad(riders, 6));
  log(
    '  MASTERS ON THE TWIN PAGE · ' +
      closure.twins.size +
      ' + ' +
      riders +
      ' = ' +
      onTwinPage +
      '  <- what you count when you open it',
  );
  log(
    '      by kind: mirrored ' +
      kinds.mirrored +
      ', host ' +
      kinds.host +
      ', rider ' +
      kinds.rider +
      ', unmarked ' +
      kinds.unmarked,
  );

  // Every unit lands in exactly one of four outcomes; the sum is printed and checked, loudly, if it doesn't balance.
  const considered =
    derived.created.length +
    derived.rederived.length +
    derived.skipped.length +
    derived.failed.length;

  log();
  log(
    'TWINS · ' +
      units.length +
      ' unit(s) = ' +
      derived.created.length +
      ' created + ' +
      derived.rederived.length +
      ' re-derived (source moved) + ' +
      derived.skipped.length +
      ' skipped (hash unchanged) + ' +
      derived.failed.length +
      ' failed',
  );

  // A failed unit is NOT in units.length, so the equation differs from it by exactly the failures.
  if (considered !== units.length + derived.failed.length) {
    log(
      '  THE EQUATION DOES NOT BALANCE: ' +
        considered +
        ' outcome(s) against ' +
        (units.length + derived.failed.length) +
        ' unit(s). This report is unreliable and the mismatch is the defect.',
    );
  }

  if (derived.skipped.length && !derived.created.length && !derived.rederived.length) {
    log('  twins up to date, skipped: ' + derived.skipped.length);
  }

  for (const name of derived.created) log('  CREATED      ' + name);
  for (const one of derived.rederived)
    log('  RE-DERIVED   ' + one.name + '  (' + one.why + ')');
  for (const problem of derived.failed) log('  FAILED       ' + problem);
  for (const problem of derived.errors) log('  ERROR        ' + problem);

  log();
  log(
    'LAYOUT · ' +
      arranged.length +
      ' unit(s) arranged in ' +
      grid.rows +
      ' row(s), ' +
      Math.round(grid.width) +
      ' x ' +
      Math.round(grid.height) +
      'px',
  );
  log("  A clone keeps its source's PARENT-relative x and y, and most masters here live");
  log(
    '  inside frames - so appended to a page root they collapse into a heap at the origin.',
  );
  log(
    '  Sorted by name, so a unit can be found and the order never depends on this run.',
  );

  log();
  log(
    'REWIRE · ' +
      rewire.rewired +
      ' instance(s) pointed at a twin, across ' +
      rewire.unitsTouched +
      ' unit(s)',
  );
  log('  left alone, master needs no twin            ' + pad(rewire.noTwin, 6));
  log('  REMOTE master, cannot be twinned            ' + pad(rewire.remote, 6));
  log('  master deleted from the file                ' + pad(rewire.orphan, 6));
  log('  failed                                      ' + pad(rewire.failed.length, 6));
  for (const problem of rewire.failed) log('      ' + problem);

  if (derived.cycles.length) {
    log();
    log('CYCLES · ' + derived.cycles.length + ' - reported and SKIPPED, never broken.');
    log('  A repair would be a guess about which edge was meant to be the real one.');
    for (const cycle of derived.cycles) {
      log('      ' + cycle.map(id => id).join(' -> '));
    }
    log('  masters skipped for being in one: ' + derived.skippedForCycle.length);
  }

  log();
  log('ARABIC MASTERS WRITTEN TO · 0');
  log(
    '  Not an intention. assertOnTwinPage runs at every mirror write and every swap and',
  );
  log(
    '  throws with the node path, so a write off the twin page stops the run instead of',
  );
  log('  happening. Phase 3 proves it by hashing both pages either side of a real run.');

  const broke = derived.failed.length + derived.errors.length + rewire.failed.length;
  setVerdict(
    'VERDICT · ' +
      onTwinPage +
      ' master(s) on the twin page from ' +
      units.length +
      ' clone unit(s), ' +
      rewire.rewired +
      ' instance(s) rewired, ' +
      broke +
      ' problem(s)' +
      (broke
        ? ' — SOMETHING FAILED, the list is above'
        : derived.created.length || derived.rederived.length
          ? ' — the twin page is current'
          : ' — nothing to do, twins already up to date'),
  );
}

// SPEC 6.7 LTR islands keep a hard direction in both locales, so realigning them would flip them twice; recognised by the deck's notes or, failing that, by shape.
const ISLAND_SHAPES = [
  /^\s*\+?\d[\d\s()+-]{5,}$/,
  /@/,
  /^\s*\d{4,6}\s*$/,
  /^\s*\d{1,2}:\d{2}(\s*[صم]|\s*[ap]m)?\s*$/i,
  /^\s*#\s*\d+\s*$/,
  /^\s*\d+(\.\d+)?\s*%\s*$/,
];

function isIsland(text, found) {
  if (found && found.island) return true;
  for (const shape of ISLAND_SHAPES) if (shape.test(text)) return true;
  return false;
}

async function buildEnglishPage() {
  heading('BUILD THE ENGLISH PAGE');

  const source = figma.currentPage;

  // Checked before the clone — cloning the components page would fork every master with no way to tell the copies apart, the one mistake here that's genuinely painful to undo.
  const masters = mastersOn(source);

  if (masters.length) {
    log(
      'This page holds ' +
        masters.length +
        ' master component(s), so it is the components page.',
    );
    log(
      'Cloning it would duplicate every one of them and leave every instance in the file',
    );
    log('pointing at one of two identical copies. Refusing.');
    log();
    log('Button 2 is what runs on this page. Run Button 3 on a screens page.');
    setVerdict(
      'VERDICT · REFUSED: this is the components page, and cloning it would fork every master',
    );
    return;
  }

  if (isEnglishPage(source)) {
    log('This page is already a built English page, so there is no Arabic here to swap.');
    log('Refusing, rather than running the deck over English a second time.');
    log();
    log('Button 4 is what runs on this page.');
    setVerdict(
      'VERDICT · REFUSED: this page is already built, so there is no Arabic to swap',
    );
    return;
  }

  // Refuses rather than replacing a same-named page, since the older one may carry by-hand frames (FIGMA-ENGLISH-GUIDE 6) a replace would destroy.
  const wanted = source.name + EN_SUFFIX;
  const existing = figma.root.children.filter(page => page.name === wanted);

  if (existing.length) {
    log('There is already a page called "' + wanted + '".');
    log(
      'Refusing, rather than leaving you two pages of the same name with no way to tell them',
    );
    log('apart. Delete or rename that page and run this again.');
    log();
    log('It is deliberately not replaced: it may hold the by-hand frames from GUIDE 6.');
    setVerdict(
      'VERDICT · REFUSED: "' +
        wanted +
        '" already exists. Delete or rename it and run again',
    );
    return;
  }

  // Before the clone — it carries exactly these faces, and Figma caches loaded fonts for the whole run.
  const fonts = await prepareFonts(source);
  log();

  // Surveyed before anything is written, so the report describes the Arabic that went in.
  const survey0 = survey(source);

  const clone = source.clone();
  clone.name = wanted;
  if (clone.loadAsync) await clone.loadAsync();

  log('cloned to "' + clone.name + '". The Arabic page itself was not written to.');
  log();

  // Before the text pass — swapComponent overrides match by layer name, so text written first gets dropped on a swap (E2's old tab-label bug).
  const swaps = await swapInstancesToTwins(clone);
  log(
    'TWINS · ' +
      swaps.swapped +
      ' instance(s) swapped to a twin, ' +
      swaps.noTwin +
      ' with no twin needed',
  );
  log('  remote master, per-instance path            ' + pad(swaps.remote, 6));
  log('  master deleted from the file                ' + pad(swaps.orphan, 6));
  if (swaps.failed.length) {
    log('  FAILED                                      ' + pad(swaps.failed.length, 6));
    for (const problem of swaps.failed) log('      ' + problem);
  }
  if (!swaps.swapped && !swaps.noTwin) {
    log(
      '  Nothing was swapped and nothing needed to be, which means Button 2 has not run.',
    );
    log(
      '  Run it on your components page first, or this page stays in Arabic direction.',
    );
  }
  log();

  const texts = clone.findAllWithCriteria({ types: ['TEXT'] });
  const typeNotes = new Map();
  // The four-way split is DERIVED from the nine terminal states, not counted beside them, so one source of truth can't disagree with itself.
  const tally = newTally();
  let bracesLeft = 0;
  const textFailures = [];
  // Layers no write can reach (a face won't load) — kept apart from failures since this is a known, named condition.
  const blockedByFont = [];
  // Reported with its node, since the fix is mechanical and a human overriding one needs to find it on the canvas.
  const overflows = [];
  const fixes = { grow: 0, truncate: 0 };

  // Nodes carrying a declared ambiguity (scripts/i18n-ambiguous.js), reported every run since a silent miss is the failure this mechanism exists to prevent.
  const ambiguousNodes = [];

  for (const node of texts) {
    tally.nodesScanned += 1;
    const characters = node.characters;

    // Ahead of the not-Arabic check, deliberately, or Latin ambiguities vanish into skipped-already-latin, the one bucket nobody reads.
    const ambiguous = AMBIGUOUS[norm(characters)];

    if (ambiguous) {
      mark(tally, 'skipped-ambiguous');
      ambiguousNodes.push({
        where: frameOf(node) + ' › ' + node.name,
        ar: ambiguous.ar,
      });
      continue;
    }

    if (!hasArabic(characters)) {
      mark(tally, 'skipped-already-latin');
      continue;
    }

    const found = resolve(characters);

    if (found.state === 'keep') {
      // Skipped before any font loads — writing the same characters back would still run the type swap.
      mark(tally, 'skipped-do-not-translate');
      continue;
    }

    if (
      found.state !== 'approved' &&
      found.state !== 'template' &&
      found.state !== 'mockup'
    ) {
      // Left in Arabic, never blanked and never guessed. survey0's buckets say why.
      mark(tally, 'left-arabic-no-source');
      continue;
    }

    // Named before a write is attempted — a node whose face won't load has no workaround.
    const blockedBy = blockedFaceOn(node, fonts.blocked);

    if (blockedBy) {
      mark(tally, 'blocked-font');
      blockedByFont.push(
        frameOf(node) +
          ' › "' +
          node.name +
          '": carries "' +
          blockedBy +
          '", which would not load',
      );
      continue;
    }

    // Once settled, a box fix that throws afterward is reported as the box fix failing, not the layer.
    let settled = false;

    // Per node, since an escaping throw would roll back the whole clone over one font.
    try {
      // Measured before the Arabic is replaced — the fix decision needs its line count.
      const measured = await measure(node, found.en, true);
      const reasons = overflowOf(node, found.en, measured, found.max);
      const fix = overflowFixFor(node, measured);

      await loadExistingFonts(node);
      for (const note of await applyEnglishType(node)) {
        typeNotes.set(note, (typeNotes.get(note) || 0) + 1);
      }

      if (reasons.length) {
        overflows.push({
          frame: frameOf(node),
          name: node.name,
          source: characters,
          key: found.key,
          english: found.en,
          reasons,
          fix,
        });
      }

      node.characters = found.en;
      // A mockup string paints exactly like any other; only its state and stamp differ.
      if (node.setPluginData) node.setPluginData(SOURCE_KEY, found.source);
      mark(tally, WRITTEN_STATE[found.state]);
      settled = true;
      if (found.unfilled && found.unfilled.length) bracesLeft += 1;

      // After the characters, so the box is sized against the English it will hold.
      if (fix && (fix.action === 'grow' || fix.action === 'truncate')) {
        applyOverflowFix(node, fix);
        fixes[fix.action] += 1;
      }
    } catch (error) {
      const message = messageOf(error);

      if (settled) {
        textFailures.push(
          frameOf(node) +
            ' › "' +
            node.name +
            '": the English was written; the box fix threw: ' +
            message,
        );
      } else {
        mark(
          tally,
          isOverrideRefusal(message) ? 'skipped-override-refused' : 'failed-write',
        );
        textFailures.push(frameOf(node) + ' › "' + node.name + '": ' + message);
      }
    }
  }

  // The equation first — it licenses every number under it.
  const sums = logEquation(tally);

  logAmbiguous(ambiguousNodes);

  // Derived from the states, never counted beside them — deck coverage and mockup set-dressing stay two distinct numbers.
  const deckWritten = tally['written-deck'] + tally['written-template'];
  const held = tally['skipped-do-not-translate'];
  const translatable = survey0.counts.arabic - held;

  logFourWay({
    ...survey0.counts,
    deck: deckWritten,
    mockup: tally['written-mockup'],
    keep: held,
    latin: tally['skipped-already-latin'],
    unfilled: bracesLeft,
    // Stated with its own denominator, so the percentage isn't read against a guessed-at number.
    shareNote:
      deckWritten +
      ' of ' +
      translatable +
      ' Arabic layer(s) before the write, excluding the ' +
      held +
      ' held by instruction',
    share: translatable ? Math.round((deckWritten / translatable) * 100) : 0,
  });

  // From survey0, so the written page is shown to agree with the pre-write survey rather than assumed to.
  logLeftInArabic(survey0.buckets, { partial: survey0.counts.partial, keep: held });

  let surveyed = 0;
  for (const name of ['draft', 'notChrome', 'missing']) {
    for (const entry of survey0.buckets[name].values()) surveyed += entry.count;
  }

  if (surveyed !== sums.left) {
    log();
    log(
      '  WARNING: the write loop left ' +
        sums.left +
        ' layer(s) in Arabic but the survey accounts for ' +
        surveyed +
        '. One of the two is wrong.',
    );
  }

  // Measured, not inferred: a fresh traversal of the page that was just written.
  const residue = measureResidue(clone);
  logResidue(residue, sums.left);

  // Frames that are not instances mirror here, because they inherit nothing from Button 2.
  const changes = [];
  const stack = [clone];
  const layoutFailures = [];
  let skipped = 0;

  // Before the walk, as in Button 2 — the name-flip fallback must only touch an instance whose master couldn't be mirrored.
  const masterless = await masterlessOn(clone);
  let layoutBlocked = 0;
  // Directional instances found below a boundary, flipped after the walk rather than during it.
  const nested = [];

  while (stack.length) {
    const node = stack.pop();

    // A text layer whose face won't load can't take the align write either — skipped here, not left to throw.
    const unwritable = node.type === 'TEXT' && blockedFaceOn(node, fonts.blocked);
    if (unwritable) layoutBlocked += 1;

    if (node.type !== 'PAGE' && !unwritable) {
      // Same per-node catch as Button 2 — an escaping throw would roll back the whole clone.
      try {
        mirrorOneNode(
          node,
          changes,
          isIsland(node.characters || '', null),
          masterless.ids,
        );
      } catch (error) {
        layoutFailures.push(
          frameOf(node) +
            ' › "' +
            node.name +
            '" (' +
            node.type +
            '): ' +
            messageOf(error),
        );
      }
    }

    // Stops at the boundary — an instance's structure was already mirrored with its master under Button 2.
    if (node.type === 'INSTANCE') {
      skipped += 1;
      // Looks past the boundary without writing past it — see directionalCandidatesUnder for the constraint.
      for (const found of directionalCandidatesUnder(node)) nested.push(found);
      continue;
    }

    for (const child of node.children || []) stack.push(child);
  }

  const directionals = await flipDirectionals(nested, changes);

  let flipped = 0;
  let variantSwapped = 0;
  let componentSwapped = 0;
  // Counted by kind, not by string-matching ' -> ' — that once miscounted 490 align writes as directional icons.
  for (const change of changes) {
    if (change.kind === 'flip') flipped += 1;
    if (change.kind === 'variant') variantSwapped += 1;
    if (change.kind === 'swap') componentSwapped += 1;
  }

  log();
  log('LAYOUT');
  log('  mirrored, not in an instance       ' + pad(changes.length, 6) + '   changes');
  log(
    '  directional icons, variant swapped ' +
      pad(variantSwapped, 6) +
      '   exact, from the Icons set',
  );
  log(
    '  directional icons, flipped by name ' +
      pad(flipped, 6) +
      '   name-matched, so check these',
  );
  log(
    '  instances skipped                  ' +
      pad(skipped, 6) +
      '   inherited from Button 2',
  );
  log(
    '  text layers skipped, font blocked  ' +
      pad(layoutBlocked, 6) +
      '   named in FONTS above',
  );
  log(
    '  directional icons, swapped whole   ' +
      pad(componentSwapped, 6) +
      '   the pair map, where a mirror would not hold',
  );
  log(
    '  directional candidates below a     ' +
      pad(nested.length, 6) +
      '   found by looking past the boundary',
  );
  log(
    '    boundary, of which written       ' +
      pad(directionals.written, 6) +
      '   capped at ' +
      FLIP_LIMIT +
      ' until the read-back is reviewed',
  );
  log(
    '  nodes that threw in this walk      ' +
      pad(layoutFailures.length, 6) +
      '   a different node set from NODES, so counted here',
  );

  logDirectionals(directionals, nested);

  if (blockedByFont.length) {
    // Both numbers, since FONTS counts every layer carrying the face while this counts only the ones with English waiting.
    let carrying = 0;
    for (const key of fonts.blocked.keys()) {
      carrying += fonts.census.carriers.get(key) || 0;
    }

    log();
    log(
      '--- ' +
        blockedByFont.length +
        ' of the ' +
        carrying +
        ' layer(s) carrying an unavailable face had copy waiting for them',
    );
    log('Named in the FONTS table above. Install the face, or change it in the file.');
    for (const entry of blockedByFont) log('  ' + entry);
  }

  // Labelled by pass and printed whole; a throw here is a BUG, not a result — the old report once hid this behind an untyped "everything else was written".
  if (textFailures.length || layoutFailures.length) {
    log();
    log(
      '--- ' +
        (textFailures.length + layoutFailures.length) +
        ' node(s) threw. A throw is a BUG, not a result, so every one is printed whole',
    );
    for (const failure of textFailures) log('  text pass    ' + failure);
    for (const failure of layoutFailures) log('  layout pass  ' + failure);
  }

  if (typeNotes.size) {
    log();
    log('--- TYPE THE TABLE DOES NOT NAME. These kept their line height');
    for (const entry of [...typeNotes.entries()].sort((a, b) => b[1] - a[1])) {
      log('  ' + pad(entry[1], 4) + 'x  ' + entry[0]);
    }
  }

  logBucket(
    'LEFT IN ARABIC - drafted, awaiting approval. Approve the row and re-run',
    survey0.buckets.draft,
    found => '   ' + (found.key || '(no finalKey)') + '  status=' + found.status,
  );

  logBucket(
    'LEFT IN ARABIC - content the app did not author. Correct, per SPEC 16.8',
    survey0.buckets.notChrome,
    found => '   kind=' + found.kind,
  );

  logBucket(
    'LEFT IN ARABIC - in neither file. The design backlog',
    survey0.buckets.missing,
    () => '',
  );

  logBucket(
    'DECK COPY STILL HOLDING ARABIC. Correct for the app; a slot value is missing here',
    survey0.partials,
    found => '   ' + (found.key || '(no finalKey)') + '  -> ' + found.en,
  );

  logSlotGaps(survey0.slotGaps);

  log();
  log(
    '--- OVERFLOW: ' +
      overflows.length +
      ' of the ' +
      sums.written +
      ' WRITTEN layer(s), measured against the real English',
  );
  log(
    'A layer that was blocked, threw or stayed Arabic was never measured and is not here.',
  );
  log(
    '  boxes grown, textAutoResize=HEIGHT   ' +
      pad(fixes.grow, 6) +
      '   the Arabic already wrapped, so the card gets taller',
  );
  log(
    '  one-line slots, textTruncation=END   ' +
      pad(fixes.truncate, 6) +
      '   the English is ellipsised: shorter copy would be better',
  );
  log(
    '  reported only, nothing written       ' +
      pad(overflows.length - fixes.grow - fixes.truncate, 6) +
      '   a tight row, or a budget breach, or a box that already grows',
  );
  log(
    'Every one is listed below with its frame, so a decision can be overridden by eye.',
  );

  if (!overflows.length) log('  nothing overflows.');
  for (const row of overflows) logOverflowRow(row, 'set');

  // "This page is covered" prints only when all four conditions hold, or it says what's wrong instead.
  const covered =
    sums.blocked === 0 &&
    sums.failed === 0 &&
    layoutFailures.length === 0 &&
    residue.total === 0 &&
    sums.written > 0;

  const threw = sums.failed + layoutFailures.length;

  setVerdict(
    'VERDICT · ' +
      sums.written +
      ' written, ' +
      (threw ? threw + ' FAILED' : '0 failed') +
      (sums.blocked ? ', ' + sums.blocked + ' BLOCKED' : '') +
      ', ' +
      residue.total +
      ' still Arabic — ' +
      (covered ? 'this page is built' : 'THIS PAGE WAS NOT BUILT'),
  );

  logDump(survey0.buckets, survey0.slotGaps, { written: sums.written, covered });

  if (masterless.groups.size) {
    let count = 0;
    for (const value of masterless.groups.values()) count += value;

    log();
    log('--- ' + count + ' instance(s) here whose master is NOT in this file');
    log('Button 2 could not reach these, so they keep their Arabic direction.');
    for (const entry of [...masterless.groups.entries()].sort((a, b) => b[1] - a[1])) {
      log('  ' + pad(entry[1], 4) + 'x  ' + entry[0]);
    }
  }
}

let budgetByEnglish = null;

/** English to its tightest budget, since Button 4's page can no longer be addressed by Arabic; two rows sharing English take the smaller budget. */
function budgetFor(english) {
  if (!budgetByEnglish) {
    budgetByEnglish = new Map();

    for (const key of Object.keys(COPY)) {
      const entry = COPY[key];
      if (entry.max === undefined) continue;

      const at = norm(entry.en);
      const was = budgetByEnglish.get(at);
      budgetByEnglish.set(at, was === undefined ? entry.max : Math.min(was, entry.max));
    }
  }

  return budgetByEnglish.get(norm(english));
}

let sourceByEnglish = null;

/** The stamp Button 3 left is the answer when there is one; the fallback reports `both` rather than guessing, since English alone can't tell deck from mockup where they share a string. */
function sourceOf(node) {
  const stamped = node.getPluginData ? node.getPluginData(SOURCE_KEY) : '';
  if (stamped === 'deck' || stamped === 'mockup')
    return { source: stamped, stamped: true };

  if (!sourceByEnglish) {
    sourceByEnglish = new Map();

    for (const key of Object.keys(MOCKUP)) {
      sourceByEnglish.set(norm(MOCKUP[key].en), 'mockup');
    }

    for (const key of Object.keys(COPY)) {
      const at = norm(COPY[key].en);
      sourceByEnglish.set(at, sourceByEnglish.has(at) ? 'both' : 'deck');
    }
  }

  return {
    source: sourceByEnglish.get(norm(node.characters)) || 'neither',
    stamped: false,
  };
}

async function overflowReport() {
  heading('OVERFLOW REPORT · nothing is written');

  const page = figma.currentPage;

  if (!isEnglishPage(page)) {
    log(
      'This page is not a built English page, so there is no English on it to measure.',
    );
    log(
      'Button 4 only runs on a page whose name ends "' +
        EN_SUFFIX +
        '". Run Button 3 first.',
    );
    log('Button 1 is the one that predicts overflow on an Arabic page.');
    setVerdict(
      'VERDICT · REFUSED: this is not a built English page, so there is no English to measure',
    );
    return;
  }

  // As in Button 1 — nothing writes to the page, but every measurement clones a text node and writes to the clone.
  const fonts = await prepareFonts(page);
  log();

  const texts = page.findAllWithCriteria({ types: ['TEXT'] });
  const measurable = [];
  const from = { deck: 0, mockup: 0, both: 0, neither: 0 };
  // Stamped vs. inferred, so the deck's line isn't read as "what Button 3 painted" when a layer was already English before the build.
  const stamped = { deck: 0, mockup: 0, both: 0, neither: 0 };
  // `mixed` is L-AS-AUTHORED content composed into English chrome; `wholly` is a string with no English yet — different people fix each.
  let mixed = 0;
  let wholly = 0;

  for (const node of texts) {
    const characters = node.characters;

    if (hasArabic(characters)) {
      if (/[A-Za-z]/.test(characters)) mixed += 1;
      else wholly += 1;
      continue;
    }

    const attributed = sourceOf(node);
    from[attributed.source] += 1;
    if (attributed.stamped) stamped[attributed.source] += 1;

    measurable.push({
      node,
      found: { en: characters, key: '', max: budgetFor(characters) },
    });
  }

  const provenance = source =>
    '   ' +
    stamped[source] +
    ' stamped by Button 3, ' +
    (from[source] - stamped[source]) +
    ' inferred from the English';

  log('  text layers                        ' + pad(texts.length, 6));
  log('  English from the app deck          ' + pad(from.deck, 6) + provenance('deck'));
  log(
    '  English from the mockup layer      ' +
      pad(from.mockup, 6) +
      provenance('mockup') +
      ', NOT app copy',
  );
  log(
    '  English from neither               ' +
      pad(from.neither, 6) +
      '   already Latin before the build',
  );

  if (from.both) {
    log(
      '  unattributable                     ' +
        pad(from.both, 6) +
        '   unstamped, and both files hold this English',
    );
  }
  log(
    '  still Arabic, part-English         ' +
      pad(mixed, 6) +
      '   SPEC 16.8 composed in, or a slot value with no row',
  );
  log(
    '  still Arabic, wholly               ' +
      pad(wholly, 6) +
      '   Button 3 left these and listed them',
  );
  log('  English layers measured            ' + pad(measurable.length, 6));

  const overflowing = await logOverflow(
    measurable,
    'OVERFLOW, measured as the page now stands',
    false,
    fonts.blocked,
  );

  setVerdict(
    'VERDICT · ' +
      measurable.length +
      ' English layer(s) measured, ' +
      overflowing +
      ' overflow, ' +
      (wholly + mixed) +
      ' still Arabic — ' +
      (overflowing || wholly
        ? 'this page needs hand work; the list is below'
        : 'nothing overflows and nothing is left in Arabic'),
  );
}

const MODES = {
  report: { run: report, writes: false },
  // Button 2 changed meaning under D-FIG-3: it now derives the twin page instead of mirroring masters in place.
  mirror: { run: deriveTwinPage, writes: true },
  build: { run: buildEnglishPage, writes: true },
  overflow: { run: overflowReport, writes: false },
  check: { run: checkTwins, writes: false },
};

figma.showUI(__html__, { width: 620, height: 600 });

figma.ui.onmessage = async message => {
  if (!message || message.type !== 'run') return;

  const mode = MODES[message.mode];
  if (!mode) return;

  out = [];
  probedPages = [];
  verdict = '';
  let notice = '';

  try {
    await mode.run();
  } catch (error) {
    // A throw that only reached the console would leave the panel on "Working…" for good.
    log();
    log('=== THE RUN STOPPED HERE');
    // The message first, on its own line — it's the diagnosis, and a Figma stack is often printed without it.
    log(messageOf(error));
    if (error && error.stack) log(error.stack);
    notice = 'The run stopped. Nothing further was written.';
    // A run that didn't finish can't report a verdict it reached before it stopped.
    setVerdict('VERDICT · THE RUN STOPPED PART WAY — ' + messageOf(error));
  } finally {
    // Runs whether the mode returned or threw, so a probe never survives a failure.
    const swept = sweepProbes(figma.currentPage);
    if (swept) log('swept ' + swept + ' measurement probe(s) left on the page');
  }

  // On top, so it's the line a reader stops at; a mode that set none gets one, so silence can't read as success.
  const head =
    verdict || 'VERDICT · the run finished without stating one, which is a bug';

  figma.ui.postMessage({
    type: 'report',
    body: [head, ''].concat(out).join('\n'),
    notice,
  });
};
