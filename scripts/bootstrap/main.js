#!/usr/bin/env node

import { checkPrerequisites } from './checkPrerequisites.js';
import { gatherValues } from './gatherValues.js';
import { configureProjects } from './configureProjects.js'
import { generateTfvarsFiles } from './generate-tfvars.js'
import { generateFirebaserc } from './generate-firebaserc.js';
import { parseArgs, log } from './utils.js';

async function main() {
  const { projectId } = parseArgs();

  log.plain('\nThis script will:');
  log.plain('• Link GCP projects to billing account');
  log.plain('• Enable required Google Cloud APIs');
  log.plain('• Generate Terraform tfvars files\n');
  log.plain('• Generate .firebaserc file');

  log.info('\n🚀 Checking prerequisites...\n');
  // Validate credentials
  if (!await checkPrerequisites()) {
    log.error('🔴 Prerequisite checks failed\n');
    process.exit(1);
  }

  log.info(`\n🚀 Gathering inputs...`);
  const gatheredValues = await gatherValues(projectId);
  if (!gatheredValues) {
    log.error('🔴 Failed to gather inputs\n');
    process.exit(1);
  }

  log.info('\n🚀 Linking projects to billing account and enabling APIs...\n');
  if (!await configureProjects(projectId, gatheredValues.gcp_billing_account_id)) {
    log.error('🔴 Failed to configure projects\n');
    process.exit(1);
  }

  log.info('\n🚀 Generating Terraform tfvars files...\n');
  if (!await generateTfvarsFiles(gatheredValues)) {
    log.error('🔴 Failed to generate Terraform tfvars files\n');
    process.exit(1);
  }

  log.info('\n🚀 Generating .firebaserc file...\n');
  if (!await generateFirebaserc(projectId)) {
    log.error('🔴 Failed to generate .firebaserc file\n');
    process.exit(1);
  }

  log.success('\n🎉 Bootstrap completed!\n');
}

main();
