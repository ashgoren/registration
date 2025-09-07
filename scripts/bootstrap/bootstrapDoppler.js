import { log, runCommand, runCommandWithResult } from './utils.js';

function dopplerProjectExists(projectId) {
  const result = runCommandWithResult(`doppler projects get ${projectId} --json 2>/dev/null`);
  return result && JSON.parse(result).id === projectId;
}

function createDopplerProjects(projects) {
  for (const project of projects) {
    if (dopplerProjectExists(project)) {
      log.info(`Doppler project ${project} already exists, skipping creation.`);
      continue;
    }
    if (!runCommand(`doppler projects create ${project}`, `Creating Doppler project ${project}`)) {
      throw new Error(`❌ Failed to create Doppler project ${project}`);
    }
    log.success(`✅ Doppler project ${project} found or created successfully.`);
  }
}

export async function bootstrapDoppler(projectId) {
  const frontendProject = projectId;
  const backendProject = `${projectId}-backend`;

  try {
    createDopplerProjects([frontendProject, backendProject]);
    return true;
  } catch (error) {
    log.error('❌ Error creating projects:', error.message);
    return false;
  }
}
