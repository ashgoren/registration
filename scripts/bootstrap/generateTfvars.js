import { mkdir, writeFile } from 'fs/promises';
import { log } from './utils.js';

export async function generateTfvarsFiles(tfvars) {
  const files = {
  'terraform/prd.tfvars': `project_id = "${tfvars.gcp_project_id}"`,
  'terraform/stg.tfvars': `project_id = "${tfvars.gcp_project_id}-stg"`,
  'terraform/shared.auto.tfvars': `doppler_project = "${tfvars.doppler_project}"
gcp_organization_id = "${tfvars.gcp_organization_id}"
gcp_billing_account_id = "${tfvars.gcp_billing_account_id}"
gcp_region = "us-west1"
github_repo = "${tfvars.github_repo}"
frontend_domain = ""
spreadsheet_url = ""
email_amazonses_smtp_user = ""
email_amazonses_smtp_password = ""
email_from_name = ""
email_from_email = ""
email_admin_notifications = ""
email_test_domains = "example.com,test.com,testing.com"`
};

  try {
    for (const [filePath, content] of Object.entries(files)) {
      const dir = filePath.split('/').slice(0, -1).join('/');
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, content);
      log.success(`✅ Created ${filePath}`);
    }
    return true;
  } catch (error) {
    log.error('❌ Error generating files:', error);
    return false;
  }
}
