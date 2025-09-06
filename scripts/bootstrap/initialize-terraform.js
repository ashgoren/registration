#!/usr/bin/env node

// NOTE: Must be run after tfvars files are filled in!
// (terraform import requires all variables to have values)

// Initialize Terraform directories
// Create stg & prd workspaces in terraform/environments
// Import existing stg & prd GCP projects into Terraform


import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { log, runCommand } from './utils.js';

const TERRAFORM_DIRECTORIES = [
  'terraform/bootstrap',
  'terraform/environments'
];

async function parseArgs() {
  const [projectId] = process.argv.slice(2);
  if (!projectId) {
    console.log('\nUsage: npm run initialize-terraform PROJECT_ID\n');
    process.exit(1);
  }
  return { projectId };
}

function ensureDirectory(dirPath) {
  if (!existsSync(dirPath)) {
    log.error(`Directory ${dirPath} must exist\n`);
    process.exit(1);
  }
}

function removeStateIfExists(resourceAddress, cwd) {
  try {
    execSync(`terraform state show ${resourceAddress}`, { stdio: 'pipe', cwd });
    log.info(`Removing existing state for ${resourceAddress}`);
    runCommand(`terraform state rm ${resourceAddress}`, 
      `Removing stale state for ${resourceAddress}`, { cwd });
  } catch (error) {
    // State doesn't exist, no need to remove
  }
}


async function setupTerraform(projectId) {
  log.info('🔧 Setting up Terraform workspaces...');
  
  // Ensure directories exist
  TERRAFORM_DIRECTORIES.forEach(ensureDirectory);
  const sharedDir = TERRAFORM_DIRECTORIES[0];
  const envDir = TERRAFORM_DIRECTORIES[1];

  // Initialize shared terraform (if not already initialized)
  if (!existsSync(path.join(sharedDir, '.terraform'))) {
    if (!runCommand('terraform init', 'Initializing shared Terraform', { cwd: sharedDir })) {
      return false;
    }
  }

  // Initialize environments terraform
  if (!existsSync(path.join(envDir, '.terraform'))) {
    if (!runCommand('terraform init', 'Initializing environments Terraform', { cwd: envDir })) {
      return false;
    }
  }

  // Create and import production workspace
  if (!runCommand('terraform workspace new prd || terraform workspace select prd', 
    'Creating/selecting production workspace', { cwd: envDir })) {
    return false;
  }

  removeStateIfExists('google_project.project', envDir);
  if (!runCommand(
    `terraform import -var 'projectId=${projectId}' google_project.project ${projectId}`,
    `Importing production project into Terraform`, { cwd: envDir }
  )) {
    return false;
  }

  // Create and import staging workspace
  if (!runCommand('terraform workspace new stg || terraform workspace select stg',
    'Creating/selecting staging workspace', { cwd: envDir })) {
    return false;
  }

  if (!runCommand(
    `terraform import -var 'projectId=${projectId}-stg' google_project.project ${projectId}-stg`,
    `Importing staging project into Terraform`, { cwd: envDir }
  )) {
    return false;
  }

  log.success('✅ Terraform setup completed');
  return true;
}

async function main() {
  const { projectId } = await parseArgs();

  log.plain('\nThis script will:');
  log.plain(`• Initialize Terraform directories: ${TERRAFORM_DIRECTORIES.join(', ')}`);
  log.plain('• Setup Terraform workspaces: prd, stg');
  log.plain('• Import GCP projects into Terraform');

  log.info('\n🚀 Creating Terraform workspaces and importing projects into Terraform...\n');
  await setupTerraform(projectId);

  log.success('\n🎉 Terraform initialization completed!\n');
}

main();
