#!/usr/bin/env node

// Note: script is idempotent except:
// - google cloud project creation fails if project already exists
// - creation of tfvars files overwrites existing contents

import { checkPrerequisites } from './checkPrerequisites.js';
import { gatherValues } from './gatherValues.js';
import { createProjects } from './createProjects.js';
import { configureProjects } from './configureProjects.js'
import { initializeTerraform } from './initializeTerraform.js'
import { generateTfvarsFiles } from './generateTfvars.js'
import { generateFirebaserc } from './generateFirebaserc.js';
import { bootstrapDoppler } from './bootstrapDoppler.js';
import { parseArgs, log } from './utils.js';

async function main() {
  const { projectId, secondArg } = parseArgs();
  const skipProjectCreation = secondArg === 'skip-project-creation';

  log.plain('\nThis script will:');
  log.plain('• Create Google Cloud projects');
  log.plain('• Link GCP projects to billing account');
  log.plain('• Enable required Google Cloud APIs');
  log.plain('• Initialize Terraform directory and workspaces');
  log.plain('• Generate Terraform tfvars files');
  log.plain('• Generate .firebaserc file');
  log.plain('• Bootstrap Doppler');

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

  if (skipProjectCreation) {
    log.info('\n⚠️ Skipping Google Cloud project creation\n');
  } else {
    log.info('\n🚀 Creating Google Cloud projects...\n');
    if (!await createProjects(projectId)) {
      log.error('🔴 Failed to create Google Cloud projects\n');
      process.exit(1);
    }
  }
  
  log.info('\n🚀 Linking projects to billing account and enabling APIs...\n');
  if (!await configureProjects(projectId, gatheredValues.gcp_billing_account_id)) {
    log.error('🔴 Failed to configure projects\n');
    process.exit(1);
  }

  log.info('\n🚀 Initializing Terraform directory & workspaces...\n');
  if (!await initializeTerraform()) {
    log.error('🔴 Failed to initialize Terraform\n');
    process.exit(1);
  }

  log.info('\n🚀 Generating Terraform tfvars files...\n');
  if (!await generateTfvarsFiles(gatheredValues)) {
    log.error('🔴 Failed to generate Terraform tfvars files\n');
    process.exit(1);
  }

  log.info('\n🚀 Generating .firebaserc file...\n');
  if (!generateFirebaserc(projectId)) {
    log.error('🔴 Failed to generate .firebaserc file\n');
    process.exit(1);
  }

  log.info('\n🚀 Bootstrapping Doppler...\n');
  if (!await bootstrapDoppler(projectId)) {
    log.error('🔴 Failed to bootstrap Doppler\n');
    process.exit(1);
  }

  log.success('\n🎉 Bootstrap completed!\n');
}

main();
