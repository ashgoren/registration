#!/usr/bin/env node

// Script to pass Doppler CLI Token to Terraform

import { log, runCommand } from './utils.js';

function parseArgs() {
  const [env, destroy] = process.argv.slice(2);
  if (!env || !['stg', 'prd'].includes(env)) {
    log.info('Invalid environment. Please specify either "stg" or "prd"');
    log.info('Usage: terraformWrapper <ENV> [destroy]\n');
    process.exit(1);
  }
  if (destroy && destroy !== 'destroy') {
    log.info('Invalid destroy flag. Please specify "destroy" to destroy the environment');
    log.info('Usage: terraformWrapper <ENV> [destroy]\n');
    process.exit(1);
  }
  return { env, destroy };
}

function main() {
  const { env, destroy } = parseArgs();
  try {
    // Command to run Terraform with Doppler environment variables
    const envCommand = "TF_VAR_DOPPLER_TOKEN=$(doppler configure get token --plain)";
    const selectWorkspaceCmd = `terraform -chdir=terraform workspace select ${env}`;
    const terraformCmd = `${envCommand} terraform -chdir=terraform ${destroy ? 'destroy' : 'apply'} -var-file='${env}.tfvars'`;

    if (!runCommand(selectWorkspaceCmd, `🔧 Selecting terraform workspace ${env}\n`)) {
      throw new Error(`Failed to select terraform workspace ${env}`);
    }
    if (!runCommand(terraformCmd, `🚀 ${destroy ? 'Destroying' : 'Applying'} terraform in ${env} environment\n`)) {
      throw new Error(`Failed to ${destroy ? 'destroy' : 'apply'} terraform in ${env} environment`);
    }

    log.success(`✅ Terraform ${destroy ? 'destroyed' : 'applied'} in ${env} environment\n`);
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
}

main();