#!/usr/bin/env node

import fs from 'fs';

if (!process.argv[2]) {
  console.error('Usage: npm run generate-firebaserc <PROJECT_ID>');
  process.exit(1);
}
const projectId = process.argv[2];
const stagingProjectId = `${projectId}-stg`;

const projects = {
  default: stagingProjectId,
  staging: stagingProjectId,
  production: `${projectId}`
};

const firebaserc = { projects };

fs.writeFileSync('.firebaserc', JSON.stringify(firebaserc, null, 2) + '\n');
console.log('Generated .firebaserc');
console.log('');
console.log(fs.readFileSync('.firebaserc', 'utf8'));
console.log('');
