// P1 variables plugin. Creates and updates only; TOKENS is prepended by the generator.

const COLLECTION_PRIMITIVES = 'Primitives';
const COLLECTION_SEMANTIC = 'Semantic';

let out = [];
const log = s => out.push(s);

// colour helpers
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

function parseColor(value) {
  if (value.startsWith('#')) return Object.assign(hexToRgb(value), { a: 1 });
  const m = /rgba?\(([^)]+)\)/.exec(value);
  if (!m) return null;
  const p = m[1].split(',').map(x => parseFloat(x.trim()));
  return {
    r: p[0] / 255,
    g: p[1] / 255,
    b: p[2] / 255,
    a: p[3] === undefined ? 1 : p[3],
  };
}

const sameColor = (a, b) =>
  a && b && ['r', 'g', 'b'].every(k => Math.abs(a[k] - b[k]) < 0.002);

// collections
async function getOrCreateCollection(name, apply) {
  const all = await figma.variables.getLocalVariableCollectionsAsync();
  const found = all.find(c => c.name === name);
  if (found) {
    log(`  collection "${name}" already exists — updating in place`);
    return found;
  }
  if (!apply) {
    log(`  collection "${name}" would be created`);
    return null;
  }
  return figma.variables.createVariableCollection(name);
}

async function upsertVariable(collection, name, type, setValue, apply, stats) {
  const existing = (
    await Promise.all(
      collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id)),
    )
  ).find(v => v && v.name === name);

  if (existing) {
    stats.updated++;
    if (apply) setValue(existing, collection.defaultModeId);
    return existing;
  }
  stats.created++;
  if (!apply) return null;
  const v = figma.variables.createVariable(name, collection, type);
  setValue(v, collection.defaultModeId);
  return v;
}

// main
async function run(apply) {
  out = [];
  const t0 = Date.now();
  log(apply ? '=== APPLY ===' : '=== DRY RUN — nothing is written ===');
  log('');

  await figma.loadAllPagesAsync();

  // 1. primitives
  log('1. Primitives collection');
  const prim = await getOrCreateCollection(COLLECTION_PRIMITIVES, apply);
  const primStats = { created: 0, updated: 0 };
  const primVars = new Map(); // name -> Variable

  if (prim) {
    for (const [name, hex] of Object.entries(TOKENS.color)) {
      const rgb = parseColor(hex);
      const v = await upsertVariable(
        prim,
        name,
        'COLOR',
        (variable, mode) => variable.setValueForMode(mode, rgb),
        apply,
        primStats,
      );
      if (v) primVars.set(name, v);
    }
    for (const [name, num] of Object.entries(TOKENS.number)) {
      await upsertVariable(
        prim,
        name,
        'FLOAT',
        (variable, mode) => variable.setValueForMode(mode, num),
        apply,
        primStats,
      );
    }
  }
  log(
    `  ${Object.keys(TOKENS.color).length} colour + ${Object.keys(TOKENS.number).length} number`,
  );
  log(`  ${primStats.created} to create, ${primStats.updated} already present`);
  log('');

  // 2. semantic aliases
  log('2. Semantic collection');
  const sem = await getOrCreateCollection(COLLECTION_SEMANTIC, apply);
  const semStats = { created: 0, updated: 0 };
  let unresolved = 0;

  if (sem) {
    for (const [name, def] of Object.entries(TOKENS.semantic)) {
      if (def.alias) {
        const target = primVars.get(def.alias);
        if (!target) {
          // Only possible on a dry run, where primitives were never created.
          unresolved++;
          continue;
        }
        await upsertVariable(
          sem,
          name,
          'COLOR',
          (variable, mode) =>
            variable.setValueForMode(mode, figma.variables.createVariableAlias(target)),
          apply,
          semStats,
        );
      } else {
        const rgba = parseColor(def.raw);
        await upsertVariable(
          sem,
          name,
          'COLOR',
          (variable, mode) => variable.setValueForMode(mode, rgba),
          apply,
          semStats,
        );
      }
    }
  }
  log(`  ${Object.keys(TOKENS.semantic).length} aliases into Primitives`);
  log(`  ${semStats.created} to create, ${semStats.updated} already present`);
  if (unresolved)
    log(
      `  ${unresolved} aliases pending — primitives must exist first (apply resolves this)`,
    );
  log('');

  // 3. bind paint styles to primitives
  log('3. Binding paint styles to variables');
  const styles = await figma.getLocalPaintStylesAsync();
  let bound = 0;
  const ambiguous = [];

  for (const style of styles) {
    const hex = TOKENS.color[style.name];
    if (!hex) continue;
    const paint = style.paints[0];
    if (!paint || paint.type !== 'SOLID') continue;

    // Two styles share `Accent/Blue/B500`. Bind the matching one and report the other.
    if (!sameColor(paint.color, parseColor(hex))) {
      ambiguous.push(`${style.name} is not the palette value — left alone`);
      continue;
    }
    bound++;
    if (apply && primVars.has(style.name)) {
      style.paints = [
        figma.variables.setBoundVariableForPaint(
          paint,
          'color',
          primVars.get(style.name),
        ),
      ];
    }
  }
  log(`  ${bound} of ${styles.length} paint styles bind to a primitive`);
  for (const a of ambiguous) log(`  ! ${a}`);
  log('');

  // 4. known style defects
  log('4. Style defects');
  const textStyles = await figma.getLocalTextStylesAsync();

  for (const s of textStyles) {
    if (s.name !== 'Label/12px/Regular') continue;
    const lh = s.lineHeight;
    if (lh.unit === 'PIXELS' && Math.abs(lh.value - 12) < 0.01) {
      log(
        `  "${s.name}" line-height 12 -> 18 (every other style holds 1.5; the app already uses 18)`,
      );
      if (apply) s.lineHeight = { unit: 'PIXELS', value: 18 };
    } else {
      log(
        `  "${s.name}" line-height already ${lh.unit === 'PIXELS' ? lh.value : lh.unit}`,
      );
    }
  }
  log('');

  // summary
  log('---');
  log(`primitives:  ${primStats.created} created, ${primStats.updated} updated`);
  log(`semantic:    ${semStats.created} created, ${semStats.updated} updated`);
  log(`styles bound:${bound}`);
  log(`deleted:     0  — by design`);
  log(`${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (!apply) log('\nDry run only. Nothing was written.');

  figma.ui.postMessage({ type: 'report', text: out.join('\n') });
}

figma.showUI(__html__, { width: 520, height: 620 });

figma.ui.onmessage = async msg => {
  if (msg.type === 'run') {
    try {
      await run(msg.apply);
    } catch (e) {
      const hint = /variable|mode|plan|permission/i.test(String(e.message))
        ? '\n\nIf this mentions plan limits: variables need a single mode here, which is\navailable on every Figma plan. Multiple modes are the gated feature.'
        : '';
      figma.ui.postMessage({
        type: 'report',
        text: `ERROR\n\n${e.stack || e.message || e}${hint}`,
      });
    }
  }
  if (msg.type === 'close') figma.closePlugin();
};
