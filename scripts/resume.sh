#!/bin/bash

# Reverses `npm run pause`: re-enables the Places and Maps APIs and the deploy workflow.
# Functions aren't recreated here. They come back on the next deploy, either from a push to
# main/staging or by running the workflow manually (printed at the end).

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
  echo "npm run resume <project_id>"
  echo ""
  exit 1
fi

STAGING_PROJECT_ID=${PROJECT_ID}-stg

gcloud auth print-access-token >/dev/null || { echo "❌ gcloud login expired: run 'gcloud auth login'"; exit 1; }

for PROJECT in $PROJECT_ID $STAGING_PROJECT_ID; do
  gcloud services enable places.googleapis.com maps-backend.googleapis.com --project $PROJECT \
    && echo "✅ Enabled Places and Maps APIs in $PROJECT" \
    || { echo "❌ Failed to enable Places and Maps APIs in $PROJECT"; exit 1; }
done

gh workflow enable firebase-hosting-merge.yml \
  && echo "✅ Enabled deploy workflow" \
  || { echo "❌ Failed to enable deploy workflow"; exit 1; }

echo ""
echo "secret-manager-cleanup is a Terraform-managed function, so a deploy doesn't recreate it:"
echo "  npm run terraform-stg && npm run terraform-prd"
echo ""
echo "To redeploy functions without a new commit:"
echo "  gh workflow run firebase-hosting-merge.yml --ref main      # production"
echo "  gh workflow run firebase-hosting-merge.yml --ref staging   # staging"
