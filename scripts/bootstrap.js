#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const REQUIRED_APIS = [
  'cloudresourcemanager.googleapis.com',
  'serviceusage.googleapis.com',
  'cloudbilling.googleapis.com',
  'apikeys.googleapis.com'
];

const TERRAFORM_DIRECTORIES = [
  'terraform/bootstrap',
  'terraform/environments'
];

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const log = {
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  plain: (msg) => console.log(msg)
};

function showHelp() {
  console.log(`
Usage: npm run bootstrap PROJECT_ID BILLING_ACCOUNT_ID

Required arguments:
  PROJECT_ID            Desired production project ID (creates PROJECT_ID and PROJECT_ID-stg)
  BILLING_ACCOUNT_ID    Billing account ID (hint: gcloud billing accounts list)
`);
}

async function parseArgs() {
  const [projectId, billingAccount] = process.argv.slice(2);
  if (!projectId || !billingAccount) {
    log.error('Error: projectId and billingAccount are required');
    showHelp();
    process.exit(1);
  }
  return { projectId, billingAccount };
}

function runCommand(command, description, options = {}) {
  log.info(description);
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log.error(`Failed to execute: ${command}`);
    log.error(`Error: ${error.message}\n`);
    return false;
  }
}

function ensureDirectory(dirPath) {
  if (!existsSync(dirPath)) {
    log.error(`Directory ${dirPath} must exist\n`);
    process.exit(1);
  }
}

function validateCredentials() {
  // Check gcloud auth
  try {
    const activeAccount = execSync(
      'gcloud auth list --filter=status:ACTIVE --format="value(account)"', 
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();
    
    if (!activeAccount) {
      log.error('No active gcloud account found. Please run: gcloud auth login');
      return false;
    }
    log.success(`✓ Authenticated with gcloud as: ${activeAccount}`);
  } catch (error) {
    log.error('gcloud not found or not authenticated. Please run: gcloud auth login');
    return false;
  }

  // Check ADC credentials
  try {
    const adcInfo = execSync(
      'gcloud auth application-default print-access-token', 
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    if (adcInfo.trim()) {
      log.success('✓ Application Default Credentials are configured');
    }
  } catch (error) {
    log.error('Application Default Credentials not found.');
    log.error('Please run: gcloud auth application-default login');
    return false;
  }

  return true;
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




// *********** CREATE PROJECTS ***********
async function createProject(projectName, billingAccount) {
  const requiredApis = REQUIRED_APIS.join(' ');

  // Create project
  if (!runCommand(
    `gcloud projects create "${projectName}"`,
    `Creating project ${projectName}`)) {
    return false;
  }

  // Link billing
  if (!runCommand(
    `gcloud billing projects link "${projectName}" --billing-account="${billingAccount}"`,
    `Linking billing account to ${projectName}`
  )) {
    return false;
  }

  // Enable APIs
  if (!runCommand(
    `gcloud services enable ${requiredApis} --project="${projectName}"`,
    `Enabling required APIs on ${projectName}`
  )) {
    return false;
  }

  log.success(`✅ Project ${projectName} created and configured\n`);
  return true;
}

async function createProjects(projectId, billingAccount) {
  try {
    if (!await createProject(projectId, billingAccount)) {
      process.exit(1);
    }
    if (!await createProject(`${projectId}-stg`, billingAccount)) {
      process.exit(1);
    }
  } catch (error) {
    log.error(`Error: ${error.message}`);
    process.exit(1);
  }
}


// *********** SETUP TERRAFORM ***********
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




// *********** MAIN ***********
async function main() {
  const { projectId, billingAccount } = await parseArgs();

  log.info('\n🔍 Validating credentials...');
  if (!validateCredentials()) {
    process.exit(1);
  }

  log.plain('\nThis script will:');
  log.plain(`• Create GCP projects: ${projectId} and ${projectId}-stg`);
  log.plain(`• Link GCP projects to billing account: ${billingAccount}`);
  log.plain('• Enable required Google Cloud APIs');
  log.plain(`• Initialize Terraform directories: ${TERRAFORM_DIRECTORIES.join(', ')}`);
  log.plain('• Setup Terraform workspaces: prd, stg');
  log.plain('• Import GCP projects into Terraform');

  log.info('\n🚀 Creating projects, linking to billing accounts, and enabling APIs...\n');
  await createProjects(projectId, billingAccount);

  log.info('\n🚀 Creating Terraform workspaces and importing projects into Terraform...\n');
  await setupTerraform(projectId);

  log.info('\n🚀 Configuring Doppler projects...\n');
  runCommand('npm run terraform-bootstrap', 'Bootstrapping Terraform');

  log.success('\n🎉 Bootstrap completed!\n');
}

main();
