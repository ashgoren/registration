import { log, runCommandWithResult } from './utils.js';
import { execSync } from 'child_process';

function validateGcloudCredentials() {
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

function validateGcloudBilling() {
  try {
    const billingOutput = runCommandWithResult('gcloud billing accounts list --format=json');
    const billingAccounts = JSON.parse(billingOutput);
    if (!billingAccounts || billingAccounts.length === 0) {
      throw new Error('No billing accounts found');
    }
    log.success('✓ Billing account found');
  } catch {
    log.error('No billing account found. Please enable billing on your Google Cloud account.');
    return false;
  }

  return true;
}

function validateDopplerCredentials() {
  try {
    const dopplerOutput = runCommandWithResult('doppler configure get token --json');
    const doppler_token = JSON.parse(dopplerOutput).token;

    if (!doppler_token) {
      throw new Error('No Doppler token found');
    }
    log.success('✓ Authenticated with Doppler');
  } catch {
    log.error('Doppler not found or not authenticated. Please run: doppler login');
    return false;
  }
  return true;
}

function validateGitHubRepo() {
  try {
    const repoOutput = runCommandWithResult('git config --get remote.origin.url');
    const repoUrl = new URL(repoOutput.trim());
    if (repoUrl.hostname !== 'github.com') {
      throw new Error('Not a GitHub repository');
    }
    log.success('✓ Valid GitHub repository');
  } catch {
    log.error('No GitHub repository found!');
    return false;
  }
  return true;
}

export async function checkPrerequisites() {
  const isValid = await Promise.all([
    validateGcloudCredentials(),
    validateGcloudBilling(),
    validateDopplerCredentials(),
    validateGitHubRepo()
  ]);
  return isValid.every(Boolean);
}
