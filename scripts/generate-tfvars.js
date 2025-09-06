#!/usr/bin/env node

import { mkdir, writeFile } from 'fs/promises';

const files = {
  'terraform/bootstrap/terraform.tfvars': `doppler_project = ""
doppler_token = ""`,

  'terraform/environments/shared.auto.tfvars': `doppler_project = ""
github_repo = ""
region = ""
billing_account_id = ""
organization_id = ""
domain = ""
doppler_token = ""
spreadsheet_url = ""
email_amazonses_smtp_user = ""
email_amazonses_smtp_password = ""
email_from_name = ""
email_from_email = ""
email_reply_to = ""
email_admin_notifications = ""
email_test_domains = ""`,

  'terraform/environments/stg.tfvars': `project_id = ""
stripe_publishable_key = ""
stripe_secret_key = ""
stripe_webhook_secret = ""
paypal_client_id = ""
paypal_client_secret = ""
paypal_webhook_id = ""`,

  'terraform/environments/prd.tfvars': `project_id = ""
stripe_publishable_key = ""
stripe_secret_key = ""
stripe_webhook_secret = ""
paypal_client_id = ""
paypal_client_secret = ""
paypal_webhook_id = ""`
};

async function generateFiles() {
  try {
    for (const [filePath, content] of Object.entries(files)) {
      const dir = filePath.split('/').slice(0, -1).join('/');
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, content);
      console.log(`✓ Created ${filePath}`);
    }
    console.log('\nAll files generated successfully!\n');
  } catch (error) {
    console.error('Error generating files:', error);
    process.exit(1);
  }
}

generateFiles();
