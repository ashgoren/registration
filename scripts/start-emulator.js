#!/usr/bin/env node

import { spawn, execSync } from 'child_process';

// Kill any existing emulator processes
try {
  execSync('pkill -f "firebase.*emulators" || true', { stdio: 'ignore' });
} catch (e) {
  // Ignore errors if no processes found
}

const child = spawn('doppler', [
  'run', '-c dev_backend', '--',
  'npx', 'concurrently',
  '--kill-others',
  '--names', 'TSC,EMU',
  '--prefix-colors', 'blue,green',
  '"cd packages/functions && tsc --watch"',
  '"firebase emulators:start -P staging"'
], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

child.on('exit', () => {
  process.exit();
});
