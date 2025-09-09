// create doppler projects if they don't yet exist (auto-creates environments)
// run doppler setup to configure local doppler default projects

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

function setupDopplerLocalEnvironment(frontendProject, backendProject) {
  if (!runCommand(`doppler setup -p ${frontendProject} -c dev`, `Setting up Doppler local environment for ${frontendProject}`)) {
    throw new Error(`❌ Failed to set up Doppler for ${frontendProject}`);
  }
  if (!runCommand(`cd functions && doppler setup -p ${backendProject} -c dev && cd ..`, `Setting up Doppler local environment for ${backendProject}`)) {
    throw new Error(`❌ Failed to set up Doppler for ${backendProject}`);
  }
}

export async function bootstrapDoppler(projectId) {
  const frontendProject = projectId;
  const backendProject = `${projectId}-backend`;
  try {
    createDopplerProjects([frontendProject, backendProject]);
    setupDopplerLocalEnvironment(frontendProject, backendProject);
    return true;
  } catch (error) {
    log.error('❌ Error creating projects:', error.message);
    return false;
  }
}
