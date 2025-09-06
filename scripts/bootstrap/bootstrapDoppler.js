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
      throw new Error(`Failed to create Doppler project ${project}`);
    }
  }
}

function prepBootstrapProject(projectId) {
  log.info('Creating stg & prd service tokens...');
  const stgToken = runCommandWithResult(`doppler configs tokens create -p ${projectId} -c stg terraform-bootstrap-stg --plain`);
  const prdToken = runCommandWithResult(`doppler configs tokens create -p ${projectId} -c prd terraform-bootstrap-prd --plain`);
  if (!stgToken || !prdToken) {
    throw new Error('Failed to create Doppler service tokens');
  }

  log.info('Storing tokens in Doppler configs...');
  const stgSuccess = runCommand(`doppler secrets set -p ${projectId} -c stg TF_VAR_DOPPLER_TOKEN="${stgToken}"`, '', { stdio: ['inherit', 'pipe', 'ignore'] });
  const prdSuccess = runCommand(`doppler secrets set -p ${projectId} -c prd TF_VAR_DOPPLER_TOKEN="${prdToken}"`, '', { stdio: ['inherit', 'pipe', 'ignore'] });
  if (!stgSuccess || !prdSuccess) {
    throw new Error('Failed to store tokens in Doppler configs');
  }
}


export async function bootstrapDoppler(projectId) {
  const frontendProject = projectId;
  const backendProject = `${projectId}-backend`;
  const bootstrapProject = `${projectId}-bootstrap`;

  const projects = [bootstrapProject, frontendProject, backendProject];

  try {
    log.info('Creating Doppler projects...');
    createDopplerProjects(projects);

    log.info('Configuring bootstrap project...');
    prepBootstrapProject(bootstrapProject);

    log.success('✅ Bootstrap project created and tokens configured!');
    return true;
  } catch (error) {
    log.error('❌ Error creating bootstrap project:', error.message);
    return false;
  }
}
