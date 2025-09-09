#!/usr/bin/env node

import { spawn } from 'child_process';

process.chdir('./functions');

const child = spawn('doppler', ['run', '--', 'firebase', 'emulators:start'], { stdio: 'inherit' });

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

child.on('exit', () => {
  process.chdir('..');
  process.exit();
});
