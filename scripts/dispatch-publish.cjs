#!/usr/bin/env node

const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const dryRunIndex = args.indexOf('--dry-run');
const dryRun = dryRunIndex !== -1;

if (dryRun) {
  args.splice(dryRunIndex, 1);
}

const version = args[0];

if (!version) {
  console.error('Usage: npm run release:dispatch -- <version> [--dry-run]');
  process.exit(1);
}

if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.]+)?$/.test(version)) {
  console.error(`Invalid version: ${version}`);
  console.error('Expected semver such as 1.3.4 or 1.3.4-beta.1');
  process.exit(1);
}

const command = [
  'workflow',
  'run',
  'publish.yml',
  '--ref',
  'main',
  '--raw-field',
  `version=${version}`,
];

if (dryRun) {
  console.log(`gh ${command.join(' ')}`);
  process.exit(0);
}

try {
  execFileSync('gh', command, { stdio: 'inherit' });
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('GitHub CLI `gh` is required to dispatch the publish workflow.');
  }

  process.exit(error.status || 1);
}
