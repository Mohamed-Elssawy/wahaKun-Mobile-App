// Runs on postinstall so the flag guard precedes every commit; plain Node, so no husky dependency.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// Present in every hook this script writes, so it can tell its own hook from one someone else made.
const MARKER = '# wahakun:flag-guard';

const HOOK = `#!/bin/sh
${MARKER} (written by scripts/install-hooks.js; rerun npm install to refresh)
npm run test:flags || {
  echo "pre-commit: a committed feature flag default changed (src/config/env.ts)." >&2
  echo "The public build runs on these values. Fix the flag, or update the guard on purpose." >&2
  exit 1
}
`;

function install() {
  // A tarball or a dependency install has no .git of its own, and must not write into a parent repo.
  if (!fs.existsSync(path.join(root, '.git'))) {
    return;
  }

  const hooksDir = path.resolve(
    root,
    execFileSync('git', ['rev-parse', '--git-path', 'hooks'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim(),
  );
  const target = path.join(hooksDir, 'pre-commit');

  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target, 'utf8');
    if (!existing.includes(MARKER)) {
      console.log(
        'Left .git/hooks/pre-commit alone: it was not written by install-hooks.js.',
      );
      return;
    }
    if (existing === HOOK) {
      return;
    }
  }

  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(target, HOOK, { mode: 0o755 });
  console.log('Installed the pre-commit hook that runs npm run test:flags.');
}

try {
  install();
} catch (error) {
  // A missing git binary or a read-only .git must never fail npm install.
  console.warn(`Skipped the pre-commit hook: ${error.message}`);
}
