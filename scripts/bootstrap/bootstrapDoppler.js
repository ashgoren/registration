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

function prepBootstrapProject({ bootstrapProject, frontendProject, backendProject }) {  
  // Create tokens for each project/config combination
  log.info('Creating service tokens for frontend and backend projects...');
  const frontendStgToken = runCommandWithResult(`doppler configs tokens create -p ${frontendProject} -c stg terraform-access-stg --plain`);
  const frontendPrdToken = runCommandWithResult(`doppler configs tokens create -p ${frontendProject} -c prd terraform-access-prd --plain`);
  const backendStgToken = runCommandWithResult(`doppler configs tokens create -p ${backendProject} -c stg terraform-access-stg --plain`);
  const backendPrdToken = runCommandWithResult(`doppler configs tokens create -p ${backendProject} -c prd terraform-access-prd --plain`);
  if (!frontendStgToken || !frontendPrdToken || !backendStgToken || !backendPrdToken) {
    throw new Error('❌ Failed to create Doppler service tokens');
  }

  // Store tokens in bootstrap configs
  log.info('Storing tokens in bootstrap project...');
  const frontStgSuccess = runCommand(`doppler secrets set -p ${bootstrapProject} -c stg TF_VAR_DOPPLER_TOKEN_FRONTEND="${frontendStgToken}"`);
  const backStgSuccess = runCommand(`doppler secrets set -p ${bootstrapProject} -c stg TF_VAR_DOPPLER_TOKEN_BACKEND="${backendStgToken}"`);
  const frontPrdSuccess = runCommand(`doppler secrets set -p ${bootstrapProject} -c prd TF_VAR_DOPPLER_TOKEN_FRONTEND="${frontendPrdToken}"`);
  const backPrdSuccess = runCommand(`doppler secrets set -p ${bootstrapProject} -c prd TF_VAR_DOPPLER_TOKEN_BACKEND="${backendPrdToken}"`);
  if (!frontStgSuccess || !backStgSuccess || !frontPrdSuccess || !backPrdSuccess) {
    throw new Error('❌ Failed to store tokens in Doppler configs');
  }

  log.success('✅ Service tokens created and stored in bootstrap project.');
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
    prepBootstrapProject({ bootstrapProject, frontendProject, backendProject });

    log.success('✅ Bootstrap project created and tokens configured!');
    return true;
  } catch (error) {
    log.error('❌ Error creating/configuring bootstrap project:', error.message);
    return false;
  }
}
