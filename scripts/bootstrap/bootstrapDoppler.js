import { log, runCommand, runCommandWithResult } from './utils.js';

export async function bootstrapDoppler(projectId) {
  const projectName = `${projectId}-bootstrap`;

  try {
    log.info('Creating Doppler bootstrap project...');
    if (!runCommand(`doppler projects create ${projectName}`, 'Creating Doppler project')) {
      throw new Error('Failed to create Doppler project');
    }

    log.info('Creating stg & prd service tokens...');
    const stgToken = runCommandWithResult(`doppler configs tokens create -p ${projectName} -c stg terraform-bootstrap-stg --plain`);
    const prdToken = runCommandWithResult(`doppler configs tokens create -p ${projectName} -c prd terraform-bootstrap-prd --plain`);
    if (!stgToken || !prdToken) {
      throw new Error('Failed to create Doppler service tokens');
    }

    log.info('Storing tokens in Doppler configs...');
    const stgSuccess = runCommand(`doppler secrets set -p ${projectName} -c stg TF_VAR_DOPPLER_TOKEN="${stgToken}"`, '', { stdio: ['inherit', 'pipe', 'ignore'] });
    const prdSuccess = runCommand(`doppler secrets set -p ${projectName} -c prd TF_VAR_DOPPLER_TOKEN="${prdToken}"`, '', { stdio: ['inherit', 'pipe', 'ignore'] });
    if (!stgSuccess || !prdSuccess) {
      throw new Error('Failed to store tokens in Doppler configs');
    }

    log.success('✅ Bootstrap project created and tokens configured!');
    return true;
  } catch (error) {
    log.error('❌ Error creating bootstrap project:', error.message);
    return false;
  }
}
