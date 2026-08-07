// Waha KUN — P0 hygiene plugin.
//
// Non-destructive only: repoints, renames, locks. It never deletes a style,
// component, variant, layer or page. Deletion is deliberately deferred to the
// end of the project, because "unused today" is not "unneeded" while screens
// are still being reworked.

// ---------------------------------------------------------------------------
// Config — the only lines you should need to edit.
// ---------------------------------------------------------------------------
const CONFIG = {
  // `Frame 52` is a component set with 8 variants (Photo × Effect). Pick a real
  // name. Set to null to leave it alone.
  FRAME_52_NEW_NAME: 'Report Photo Card',

  // Non-canonical screen pages. Their top-level frames get locked so rework
  // can only happen on the Hi-Fi pages. Nothing is deleted.
  FREEZE_PAGES: ['⚡ Prototype', 'UI Screens - draft'],
  FREEZE_PREFIX: '🔒 ',

  // Repointing raw (styleless) Latin text is the one step with judgement in it,
  // so it is off unless you tick the box in the UI.
  REPOINT_RAW_LATIN: false,
};

// Families that should not appear in an Arabic-first file.
const LATIN_FAMILY = /^(Inter|Futura PT)$/;
// Families that are legitimately ours.
const NATIVE_FAMILY = /^(Noto Sans Arabic|Cairo|Lora)$/;

// Typos safe to fix mechanically: unambiguous, and no name collision results.
//
// Deliberately NOT here — both need a human:
//   `listt` (35 uses) vs `list` (18 uses)   — two different icons, renaming collides
//   `bar chart` vs the existing `bar-chart` — same collision
const SAFE_RENAMES = [
  { find: 'Crirtical', replace: 'Critical' },
  { find: 'Expert-Overriden', replace: 'Expert-Overridden' },
  { find: 'CIrcle', replace: 'Circle' },
];

// Arabic combining diacritics U+064B-U+0652 and U+0670. One of them (U+0650
// KASRA) is sitting invisibly at the front of `Admin Report Card`.
const STRAY_DIACRITIC = /[ً-ْٰ]/g;

// loadFontAsync is cheap on repeat but not free; only ask once per family+style.
const loadedFonts = new Set();
async function ensureFont(fontName) {
  if (!fontName || fontName === figma.mixed) return true;
  const key = fontName.family + '|' + fontName.style;
  if (loadedFonts.has(key)) return true;
  try {
    await figma.loadFontAsync(fontName);
    loadedFonts.add(key);
    return true;
  } catch (e) {
    log(`  ! could not load ${key} — layers using it were skipped`);
    loadedFonts.add(key); // don't retry a font that isn't available
    return false;
  }
}

let out = [];
const log = (s) => out.push(s);

// ---------------------------------------------------------------------------
// Text styles
// ---------------------------------------------------------------------------

// Two styles share a name; one resolves to Noto/Cairo, the other to Inter.
// Nothing in Figma's UI distinguishes them, so picking from the panel is a coin
// flip. Map every Latin one onto its native twin.
async function buildStyleRepointMap() {
  const styles = await figma.getLocalTextStylesAsync();
  const byName = new Map();
  for (const s of styles) {
    if (!byName.has(s.name)) byName.set(s.name, []);
    byName.get(s.name).push(s);
  }

  const repoint = new Map(); // bad style id -> canonical style
  for (const [name, list] of byName) {
    if (list.length < 2) continue;
    const canonical = list.find((s) => NATIVE_FAMILY.test(s.fontName.family));
    if (!canonical) {
      log(`  ! "${name}" is duplicated but no native twin found — skipped`);
      continue;
    }
    for (const s of list) {
      if (s.id !== canonical.id && LATIN_FAMILY.test(s.fontName.family)) {
        repoint.set(s.id, canonical);
        log(`  "${name}" ${s.fontName.family} -> ${canonical.fontName.family}`);
      }
    }
  }

  // Wireframe leftover with no same-name twin; body 16 is its nearest match.
  const wf = styles.find((s) => s.name === 'WF Body/Body Medium');
  const body16 = (byName.get('Body/16px/Regular') || []).find((s) =>
    NATIVE_FAMILY.test(s.fontName.family),
  );
  if (wf && body16) {
    repoint.set(wf.id, body16);
    log(`  "WF Body/Body Medium" -> "Body/16px/Regular"`);
  }

  return { styles, byName, repoint };
}

// Size -> style name, for raw text carrying no style at all. Only sizes with an
// exact equivalent in the scale are mapped; the rest are reported, not guessed.
function pickStyleForRawText(node, byName) {
  const size = node.fontSize;
  const isBold = /Bold|SemiBold|Demi|Medium/i.test(node.fontName.style || '');
  const name =
    size === 12 ? (isBold ? 'Label/12px/Bold' : 'Label/12px/Regular')
    : size === 14 ? (isBold ? 'Label/14px/Bold' : 'Label/14px/Regular')
    : size === 16 ? (isBold ? 'Label/16px/Bold' : 'Label/16px/Regular')
    : size === 20 ? (isBold ? 'Label/20px/Bold' : 'Label/20px/Regular')
    : size === 24 ? 'Headings/h3'
    : size === 32 ? 'Headings/h2'
    : size === 40 ? 'Headings/h1'
    : null;
  if (!name) return null;
  return (byName.get(name) || []).find((s) => NATIVE_FAMILY.test(s.fontName.family)) || null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run(apply, repointRaw) {
  out = [];
  const t0 = Date.now();
  const counts = { styled: 0, raw: 0, rawSkipped: 0, renamed: 0, locked: 0 };

  log(apply ? '=== APPLY ===' : '=== DRY RUN — nothing is written ===');
  log('');

  await figma.loadAllPagesAsync();

  // --- 1. style collisions -------------------------------------------------
  log('1. Text style collisions');
  const { byName, repoint } = await buildStyleRepointMap();
  if (!repoint.size) log('  none found');
  log('');

  // Applying a text style requires its font loaded first.
  if (apply) {
    const fonts = new Set();
    for (const s of repoint.values()) fonts.add(JSON.stringify(s.fontName));
    for (const list of byName.values()) {
      for (const s of list) if (NATIVE_FAMILY.test(s.fontName.family)) fonts.add(JSON.stringify(s.fontName));
    }
    for (const f of fonts) await ensureFont(JSON.parse(f));
  }

  // --- 2. repoint text -----------------------------------------------------
  log('2. Repointing text layers');
  const texts = figma.root.findAllWithCriteria({ types: ['TEXT'] });
  const rawSizes = new Map();

  for (const node of texts) {
    const sid = node.textStyleId;

    if (typeof sid === 'string' && sid && repoint.has(sid)) {
      counts.styled++;
      // Figma refuses to touch a text node whose *current* font isn't loaded,
      // even when the edit only swaps the style.
      if (apply && (await ensureFont(node.fontName))) {
        await node.setTextStyleIdAsync(repoint.get(sid).id);
      }
      continue;
    }

    // Styleless Latin text — the 368 Inter + 75 Futura PT layers.
    if (sid === '' && node.fontName !== figma.mixed && LATIN_FAMILY.test(node.fontName.family)) {
      const target = pickStyleForRawText(node, byName);
      if (!target) {
        counts.rawSkipped++;
        const k = `${node.fontName.family} ${node.fontSize}`;
        rawSizes.set(k, (rawSizes.get(k) || 0) + 1);
        continue;
      }
      counts.raw++;
      if (apply && repointRaw && (await ensureFont(node.fontName))) {
        await node.setTextStyleIdAsync(target.id);
      }
    }
  }

  log(`  ${counts.styled} layers on a colliding style -> native twin`);
  log(
    `  ${counts.raw} styleless Latin layers -> matched style` +
      (repointRaw ? '' : '   (skipped — tick "repoint raw Latin text" to include)'),
  );
  if (counts.rawSkipped) {
    log(`  ${counts.rawSkipped} styleless Latin layers have no equivalent — handle by hand:`);
    for (const [k, n] of [...rawSizes].sort((a, b) => b[1] - a[1])) log(`      ${k}px  ×${n}`);
  }
  log('');

  // --- 3. renames ----------------------------------------------------------
  log('3. Renames');
  const named = figma.root.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] });

  for (const node of named) {
    let next = node.name;

    for (const r of SAFE_RENAMES) next = next.split(r.find).join(r.replace);
    // Unconditional: `.test()` on a /g regex advances lastIndex and would
    // return false on every other call.
    next = next.replace(STRAY_DIACRITIC, '').trim();
    if (next === 'Progress Bar Base') next = '_Progress Bar Base';
    if (node.type === 'COMPONENT_SET' && node.name === 'Frame 52' && CONFIG.FRAME_52_NEW_NAME) {
      next = CONFIG.FRAME_52_NEW_NAME;
    }

    if (next !== node.name) {
      counts.renamed++;
      log(`  "${node.name}"  ->  "${next}"`);
      if (apply) node.name = next;
    }
  }
  if (!counts.renamed) log('  nothing to rename');
  log('');

  // --- 4. freeze non-canonical pages ---------------------------------------
  log('4. Freezing non-canonical pages');
  for (const page of figma.root.children) {
    const bare = page.name.replace(CONFIG.FREEZE_PREFIX, '');
    if (!CONFIG.FREEZE_PAGES.includes(bare)) continue;

    let n = 0;
    for (const frame of page.children) {
      if (frame.locked) continue;
      n++;
      counts.locked++;
      if (apply) frame.locked = true;
    }
    log(`  ${bare}: ${n} of ${page.children.length} top-level frames locked` +
      (n < page.children.length ? ' (rest already locked)' : ''));
    if (apply && !page.name.startsWith(CONFIG.FREEZE_PREFIX)) {
      page.name = CONFIG.FREEZE_PREFIX + bare;
    }
  }
  log('');

  // --- summary -------------------------------------------------------------
  log('---');
  log(`text repointed (styled): ${counts.styled}`);
  log(`text repointed (raw):    ${counts.raw}${repointRaw ? '' : ' (not applied)'}`);
  log(`renamed:                 ${counts.renamed}`);
  log(`frames locked:           ${counts.locked}`);
  log(`deleted:                 0  — by design`);
  log(`${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (!apply) log('\nDry run only. Nothing was written.');

  figma.ui.postMessage({ type: 'report', text: out.join('\n') });
}

figma.showUI(__html__, { width: 520, height: 620 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'run') {
    try {
      await run(msg.apply, msg.repointRaw);
    } catch (e) {
      figma.ui.postMessage({ type: 'report', text: `ERROR\n\n${e.stack || e.message || e}` });
    }
  }
  if (msg.type === 'close') figma.closePlugin();
};
