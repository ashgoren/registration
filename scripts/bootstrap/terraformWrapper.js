#!/usr/bin/env node

// Script to pass Doppler CLI Token to Terraform

import { log, runCommand } from './utils.js';

function parseArgs() {
  const [env] = process.argv.slice(2);
  if (!env || !['stg', 'prd'].includes(env)) {
    log.info('Invalid environment. Please specify either "stg" or "prd"');
    log.info('Usage: terraformWrapper <ENV>\n');
    process.exit(1);
  }
  return { env };
}

function main() {
  const { env } = parseArgs();
  try {
    // Command to run Terraform with Doppler environment variables
    const envCommand = "TF_VAR_DOPPLER_TOKEN=$(doppler configure get token --plain)";
    const selectWorkspaceCmd = `${envCommand} terraform -chdir=terraform workspace select ${env}`;
    const terraformApplyCmd = `${envCommand} terraform -chdir=terraform apply -var-file='${env}.tfvars'`;

    if (!runCommand(selectWorkspaceCmd, `🔧 Selecting terraform workspace ${env}\n`)) {
      throw new Error(`Failed to select terraform workspace ${env}`);
    }
    if (!runCommand(terraformApplyCmd, `🚀 Applying terraform in ${env} environment\n`)) {
      throw new Error(`Failed to apply terraform in ${env} environment`);
    }

    log.success(`✅ Terraform applied in ${env} environment\n`);
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
}

main();