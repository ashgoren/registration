// create doppler projects if they don't yet exist (which auto-creates environments)
// create frontend & backend configs on each environment
// run doppler setup to configure local doppler default projects

import { log, runCommand, runCommandWithResult } from './utils.js';

function dopplerProjectExists(projectId) {
  const result = runCommandWithResult(`doppler projects get ${projectId} --json 2>/dev/null`);
  return result && JSON.parse(result).id === projectId;
}

function createDopplerProject(projectId) {
  if (dopplerProjectExists(projectId)) {
    log.info(`Doppler project ${projectId} already exists, skipping creation.`);
    return;
  }

  if (!runCommand(`doppler projects create ${projectId}`, `Creating Doppler project ${projectId}`)) {
    throw new Error(`❌ Failed to create Doppler project ${projectId}`);
  }
  log.success(`✅ Doppler project ${projectId} found or created successfully.`);
}


function configExists(projectId, config) {
  const result = runCommandWithResult(`doppler configs get -p ${projectId} ${config} --json 2>/dev/null`);
  return result && JSON.parse(result).name === config;
}

function createConfig(projectId, config) {
  if (configExists(projectId, config)) {
    log.info(`Doppler config ${config} for project ${projectId} already exists, skipping creation.`);
    return;
  }
  if (!runCommand(`doppler configs create -p ${projectId} ${config}`, `Creating Doppler config ${config} for project ${projectId}`)) {
    throw new Error(`❌ Failed to create Doppler config ${config} for project ${projectId}`);
  }
  log.success(`✅ Doppler config ${config} for project ${projectId} created successfully.`);
}

function createDopplerConfigs(projectId) {
  const environments = ['dev', 'stg', 'prd'];
  for (const env of environments) {
    const configs = [`${env}_frontend`, `${env}_backend`];
    for (const config of configs) {
      createConfig(projectId, config);
    }
  }
}


function setupDopplerLocalEnvironments(projectId) {
  if (!runCommand(`doppler setup -p ${projectId} -c dev_frontend`, `Setting up Doppler local environment for ${projectId} dev_frontend`)) {
    throw new Error(`❌ Failed to set up Doppler for ${projectId}-dev_frontend`);
  }
  log.success(`✅ Doppler local environment for ${projectId} dev_frontend set up successfully.`);

  if (!runCommand(`cd functions && doppler setup -p ${projectId} -c dev_backend && cd ..`, `Setting up Doppler local environment for ${projectId} dev_backend`)) {
    throw new Error(`❌ Failed to set up Doppler for ${projectId}-dev_backend`);
  }
  log.success(`✅ Doppler local environment for ${projectId} dev_backend set up successfully.`);
}

export async function bootstrapDoppler(projectId) {
  try {
    createDopplerProject(projectId);
    createDopplerConfigs(projectId);
    setupDopplerLocalEnvironments(projectId);
    return true;
  } catch (error) {
    log.error('❌ Error creating projects:', error.message);
    return false;
  }
}
