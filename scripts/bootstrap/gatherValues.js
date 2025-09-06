import { log, runCommandWithResult } from './utils.js';

export async function gatherValues(gcp_project_id) {
  try {
    // Use same value for Doppler project
    const doppler_project = gcp_project_id;

    // Get GCP billing account & organization id
    const billingOutput = runCommandWithResult('gcloud billing accounts list --format=json');
    const gcp_billing_account_id = JSON.parse(billingOutput)[0]?.name.split('/').pop();
    const gcp_organization_id = JSON.parse(billingOutput)[0]?.parent.split('/').pop();

    // Get Doppler token
    const dopplerOutput = runCommandWithResult('doppler configure get token --json');
    const doppler_token = JSON.parse(dopplerOutput).token;

    // Get GitHub repo
    const gitUrl = runCommandWithResult('git config --get remote.origin.url');
    const github_repo = gitUrl.split('/').pop().replace('.git', '');

    if (!gcp_project_id || !doppler_project || !gcp_organization_id || !gcp_billing_account_id || !doppler_token || !github_repo) {
      throw new Error('Unable to gathering values');
    }

    log.success('\n✓ Successfully gathered inputs');
    return {
      gcp_project_id,
      doppler_project,
      gcp_organization_id,
      gcp_billing_account_id,
      doppler_token,
      github_repo
    };
  } catch (error) {
    log.error('\nError gathering values:', error);
    return null;
  }
}
