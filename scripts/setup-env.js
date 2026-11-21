// Runs on postinstall so the gitignored env.local.ts the module graph imports always exists.
const fs = require('fs');
const path = require('path');

const configDir = path.join(__dirname, '..', 'src', 'config');
const target = path.join(configDir, 'env.local.ts');
const example = path.join(configDir, 'env.local.example.ts');

if (!fs.existsSync(example)) {
  // Nothing to copy from, likely a partial checkout. Not fatal.
  process.exit(0);
}

// Runs before any TypeScript tooling exists, so the export names are read as plain text.
function exportedConstNames(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const names = [];
  const pattern = /export const (\w+)/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    names.push(match[1]);
  }
  return names;
}

if (fs.existsSync(target)) {
  // D21: a stale env.local.ts can miss HOST_OVERRIDE and silently resolve to the emulator address.
  const missing = exportedConstNames(example).filter(
    name => !exportedConstNames(target).includes(name),
  );

  if (missing.length > 0) {
    console.warn('');
    console.warn('='.repeat(72));
    console.warn(
      'src/config/env.local.ts is missing override(s) env.local.example.ts now has:',
    );
    missing.forEach(name => console.warn(`  - ${name}`));
    console.warn('Add them by hand - this script never rewrites your file for you.');
    console.warn('='.repeat(72));
    console.warn('');
  }

  process.exit(0);
}

fs.copyFileSync(example, target);
console.log('Created src/config/env.local.ts. Set HOST_OVERRIDE for physical devices.');
