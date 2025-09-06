// Initialize Terraform directory; create prd & stg workspaces

import { log, runCommand } from './utils.js';

const terraformDir = 'terraform';
const workspaces = ['prd', 'stg'];

export async function initializeTerraform() {
  log.info('🔧 Setting up Terraform workspaces...');

  // Initialize terraform
  if (!runCommand('terraform init', 'Initializing Terraform', { cwd: terraformDir })) {
    return false;
  }

  // Create workspaces
  for (const workspace of workspaces) {
    if (!runCommand(`terraform workspace new ${workspace} || terraform workspace select ${workspace}`,
      `Creating ${workspace} workspace`, { cwd: terraformDir })) {
      return false;
    }
  }

  log.success('✅ Terraform setup completed');
  return true;
}
