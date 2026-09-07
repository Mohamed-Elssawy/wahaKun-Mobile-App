// Emits the Figma variable table from src/theme. Run: npm run tokens:figma

const fs = require('fs');
const os = require('os');
const path = require('path');

const PLUGIN_DIR = path.join(__dirname, '..', 'tools', 'figma-p1-plugin');
// A Figma manifest loads one script, so tokens and plugin source concatenate into main.js.
const OUT = path.join(PLUGIN_DIR, 'main.js');

// Palette path -> Figma variable name, matching the paint style names 1:1.
const PALETTE_GROUP = {
  primary: k => `Primary/${k}`,
  secondary: k => `Secondary/${k}`,
  neutral: k =>
    k === 'white' || k === 'black'
      ? `Neutral/${k[0].toUpperCase()}${k.slice(1)}`
      : `Neutral/${k}`,
  'accent.red': k => `Accent/Red/${k}`,
  'accent.amber': k => `Accent/Amber/${k}`,
  'accent.blue': k => `Accent/Blue/${k}`,
  'accent.green': k => `Accent/Light Green/${k}`,
};

// colors key -> semantic variable path.
const SEMANTIC_PATH = {
  primary: 'brand/primary',
  primaryPressed: 'brand/pressed',
  primaryMuted: 'brand/muted',
  primaryTint: 'brand/tint',

  background: 'bg/canvas',
  surface: 'bg/surface',
  surfaceMuted: 'bg/surface-muted',
  overlay: 'bg/overlay',

  textPrimary: 'text/primary',
  textStrong: 'text/strong',
  textSecondary: 'text/secondary',
  textMuted: 'text/muted',
  textPlaceholder: 'text/placeholder',
  textDisabled: 'text/disabled',
  textInverse: 'text/inverse',

  border: 'border/default',
  borderStrong: 'border/strong',
  borderControl: 'border/control',
  divider: 'border/divider',

  disabled: 'state/disabled',

  error: 'status/error',
  warning: 'status/warning',
  info: 'status/info',
  success: 'status/success',
  errorTint: 'status/error-tint',
  warningTint: 'status/warning-tint',
  infoTint: 'status/info-tint',
  successTint: 'status/success-tint',
  errorText: 'status/error-text',
  warningText: 'status/warning-text',
  infoText: 'status/info-text',
  successText: 'status/success-text',

  shadow: 'effect/shadow',
};

// Metro resolves layout.ts's extensionless './colors'; raw ESM needs it stripped.
async function loadLayout() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'theme', 'layout.ts'),
    'utf8',
  );
  const trimmed = src
    .replace(/^import[^;]+;\s*/m, '')
    .replace(/export const shadows[\s\S]*$/m, '');
  const tmp = path.join(os.tmpdir(), `wk-layout-${Date.now()}.mts`);
  fs.writeFileSync(tmp, trimmed);
  try {
    return await import(`file://${tmp.replace(/\\/g, '/')}`);
  } finally {
    fs.unlinkSync(tmp);
  }
}

(async () => {
  const { palette, colors } = await import('../src/theme/colors.ts');
  const { spacing, radii } = await loadLayout();

  const color = {};
  const byHex = new Map();
  const collide = [];

  const add = (name, hex) => {
    color[name] = hex;
    const up = hex.toUpperCase();
    if (byHex.has(up)) collide.push(`${name} and ${byHex.get(up)} are both ${up}`);
    else byHex.set(up, name);
  };

  for (const [group, fmt] of Object.entries(PALETTE_GROUP)) {
    const node = group.split('.').reduce((o, k) => o[k], palette);
    for (const [k, v] of Object.entries(node)) add(fmt(k), v);
  }
  add('Background', palette.background);

  const number = {};
  for (const [k, v] of Object.entries(spacing)) number[`Space/${k}`] = v;
  for (const [k, v] of Object.entries(radii)) {
    number[`Radius/${k === 'pill' ? 'Pill' : k}`] = v;
  }

  const semantic = {};
  const unresolved = [];
  for (const [key, value] of Object.entries(colors)) {
    const pathName = SEMANTIC_PATH[key];
    if (!pathName) {
      unresolved.push(`no semantic path mapped for colors.${key}`);
      continue;
    }
    const primitive = byHex.get(String(value).toUpperCase());
    if (primitive) semantic[pathName] = { alias: primitive };
    else semantic[pathName] = { raw: value }; // e.g. overlay's rgba()
  }

  const missing = Object.keys(colors).filter(k => !SEMANTIC_PATH[k]);

  const banner = `// Generated from src/theme. Edit tools/figma-p1-plugin/code.js, then: npm run tokens:figma\n\n`;

  const pluginSource = fs.readFileSync(path.join(PLUGIN_DIR, 'code.js'), 'utf8');

  fs.writeFileSync(
    OUT,
    banner +
      `const TOKENS = ${JSON.stringify({ color, number, semantic }, null, 2)};\n\n` +
      pluginSource,
  );

  console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
  console.log(`  ${Object.keys(color).length} colour primitives`);
  console.log(`  ${Object.keys(number).length} number primitives`);
  console.log(`  ${Object.keys(semantic).length} semantic aliases`);
  if (collide.length) {
    console.log(
      '\n  note: primitives sharing a value (alias target picked by first match):',
    );
    for (const c of collide) console.log('    ' + c);
  }
  if (missing.length) {
    console.log('\n  WARNING: colors keys with no semantic path (add to SEMANTIC_PATH):');
    for (const m of missing) console.log('    ' + m);
    process.exitCode = 1;
  }
})();
