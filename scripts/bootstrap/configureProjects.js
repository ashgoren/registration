import { log, runCommand } from './utils.js';

const REQUIRED_APIS = [
  'cloudresourcemanager.googleapis.com',
  'serviceusage.googleapis.com',
  'cloudbilling.googleapis.com',
  'apikeys.googleapis.com'
];

async function configureProject(projectId, billingAccount) {
  const requiredApis = REQUIRED_APIS.join(' ');

  // Link billing
  if (!runCommand(
    `gcloud billing projects link "${projectId}" --billing-account="${billingAccount}"`,
    `Linking billing account to ${projectId}`
  )) {
    return false;
  }

  // Enable APIs
  if (!runCommand(
    `gcloud services enable ${requiredApis} --project="${projectId}"`,
    `Enabling required APIs on ${projectId}`
  )) {
    return false;
  }

  log.success(`✅ Project ${projectId} configured\n`);
  return true;
}

export async function configureProjects(projectId, billingAccount) {
  try {
    if (!await configureProject(projectId, billingAccount)) {
      throw new Error(`Failed to configure project: ${projectId}`);
    }
    if (!await configureProject(`${projectId}-stg`, billingAccount)) {
      throw new Error(`Failed to configure project: ${projectId}-stg`);
    }
    return true;
  } catch (error) {
    log.error(`❌ Error: ${error.message}`);
    return false;
  }
}
