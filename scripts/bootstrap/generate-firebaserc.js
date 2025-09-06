import fs from 'fs';
import { log } from './utils.js';

export function generateFirebaserc(projectId) {
  const projects = {
    default: `${projectId}-stg`,
    staging: `${projectId}-stg`,
    production: `${projectId}`
  };

  try {
    const firebaserc = { projects };

    fs.writeFileSync('.firebaserc', JSON.stringify(firebaserc, null, 2) + '\n');
    console.log(fs.readFileSync('.firebaserc', 'utf8'));

    log.success('✓ .firebaserc file generated successfully');
    return true;
  } catch (error) {
    log.error('Error generating .firebaserc file:', error);
    return false;
  }
}
