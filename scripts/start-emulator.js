#!/usr/bin/env node

import { spawn } from 'child_process';

process.chdir('./functions');

const child = spawn('doppler', [
  'run', '--',
  'npx', 'concurrently',
  '--kill-others',
  '--names', 'TSC,EMU',
  '--prefix-colors', 'blue,green',
  '"tsc --watch"',
  '"firebase emulators:start -P staging"'
], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

child.on('exit', () => {
  process.chdir('..');
  process.exit();
});
