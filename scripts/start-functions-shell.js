#!/usr/bin/env node

import { spawn } from 'child_process';

process.chdir('./packages/functions');

const child = spawn('doppler', ['run', '--', 'firebase', 'functions:shell', '-P', 'staging'], { stdio: 'inherit' });

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

child.on('exit', () => {
  process.chdir('../..');
  process.exit();
});
