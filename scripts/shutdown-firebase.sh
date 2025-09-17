#!/bin/bash

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
  echo "npm run shutdown <project_id>"
  echo ""
  exit 1
fi

STAGING_PROJECT_ID=${PROJECT_ID}-stg

echo ""
echo "⚠️ Shutting down Firebase project: ${PROJECT_ID} and ${STAGING_PROJECT_ID}..."
echo ""

# terraform destroy
npm run terraform-destroy-stg
npm run terraform-destroy-prd
echo "✅ Destroyed terraform resources"

# Delete firebase functions
firebase functions:delete $(firebase functions:list -P ${STAGING_PROJECT_ID} --json | jq -r '.result.[].id' | tr '\n' ' ') -f
firebase functions:delete $(firebase functions:list -P ${PROJECT_ID} --json | jq -r '.result.[].id' | tr '\n' ' ') -f
echo "✅ Deleted firebase functions"

# Delete firestore database
gcloud firestore databases delete --database="(default)" --project=${STAGING_PROJECT_ID}
gcloud firestore databases delete --database="(default)" --project=${PROJECT_ID}
echo "✅ Deleted firestore databases"

# Delete pubsub topics
gcloud pubsub topics delete budget_alerts --project=${STAGING_PROJECT_ID}
gcloud pubsub topics delete budget_alerts --project=${PROJECT_ID}
echo "✅ Deleted pubsub topics"
