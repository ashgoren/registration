#!/usr/bin/env node

// Script to pass Doppler bootstrapping token stored in Doppler to Terraform
// projectId is used for logging and for determining the Doppler bootstrap project name

import { log, runCommand, runCommandWithResult } from './utils.js';

function parseArgs() {
  const [env, projectId] = process.argv.slice(2);
  if (!env || !['stg', 'prd'].includes(env)) {
    log.info('Invalid environment. Please specify either "stg" or "prd"');
    log.info('Usage: terraformWrapper <ENV> <PROJECT_ID>\n');
    process.exit(1);
  }
  if (!projectId) {
    log.info('Missing Project ID');
    log.info(`Usage: npm run terraform-${env} PROJECT_ID\n`);
    process.exit(1);
  }
  return { env, projectId };
}

function dopplerProjectExists(projectId) {
  const result = runCommandWithResult(`doppler projects get ${projectId} --json 2>/dev/null`);
  return result && JSON.parse(result).id === projectId;
}

function main() {
  const { env, projectId } = parseArgs();
  const dopplerBootstrapProject = `${projectId}-bootstrap`;

  if (!dopplerProjectExists(dopplerBootstrapProject)) {
    log.error(`❌ Doppler project ${dopplerBootstrapProject} does not exist\n`);
    process.exit(1);
  }

  log.info(`Using Doppler project: ${dopplerBootstrapProject}\n`);
  try {
    // Command to run Terraform with Doppler environment variables
    const dopplerCmd = `doppler run -p ${dopplerBootstrapProject} -c ${env}`
    const selectWorkspaceCmd = `${dopplerCmd} -- terraform -chdir=terraform workspace select ${env}`
    const terraformApplyCmd = `${dopplerCmd} -- terraform -chdir=terraform apply -var-file='${env}.tfvars'`

    if (!runCommand(selectWorkspaceCmd, `🔧 Selecting terraform workspace ${env}\n`)) {
      throw new Error(`Failed to select terraform workspace ${env}`);
    }
    if (!runCommand(terraformApplyCmd, `🚀 Applying terraform for project ${projectId} in ${env} environment\n`)) {
      throw new Error(`Failed to apply terraform for project ${projectId} in ${env} environment`);
    }

    log.success(`✅ Terraform applied for project ${projectId} in ${env} environment\n`);
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
}

main();