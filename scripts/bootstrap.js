#!/usr/bin/env node

import { execSync } from 'child_process';
import { log, runCommand } from './utils.js';

const REQUIRED_APIS = [
  'cloudresourcemanager.googleapis.com',
  'serviceusage.googleapis.com',
  'cloudbilling.googleapis.com',
  'apikeys.googleapis.com'
];

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
  log.plain('• Generate .firebaserc file');

  log.info('\n🚀 Creating projects, linking to billing accounts, and enabling APIs...\n');
  await createProjects(projectId, billingAccount);

  log.info('\n🚀 Generating .firebaserc file...\n');
  runCommand(`npm run generate-firebaserc ${projectId}`, 'Generating .firebaserc');
  
  log.success('\n🎉 Bootstrap completed!\n');
}

main();
