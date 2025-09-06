import { log, runCommand } from './utils.js';

export async function createProjects(projectId) {
  log.info(`Creating Google Cloud projects for ${projectId}...`);

  if (!runCommand(`gcloud projects create ${projectId}`, `Creating project ${projectId}`)) {
    return false;
  }

  if (!runCommand(`gcloud projects create ${projectId}-stg`, `Creating project ${projectId}-stg`)) {
    return false;
  }

  log.success(`✅ Successfully created Google Cloud projects`);
  return true;
}
