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

if (fs.existsSync(target)) {
  process.exit(0);
}

fs.copyFileSync(example, target);
console.log('Created src/config/env.local.ts. Set HOST_OVERRIDE for physical devices.');
