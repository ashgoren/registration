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


# INSTRUCTIONS FOR MANUAL SHUTDOWN FOR OLD PROJECTS
# Do not delete the firebase project from the console, as this will delete the GCP project as well!
# Do not delete service accounts used internally by GCP - delete only sheets & github action ones

# enable APIs if disabled

# DELETE FIREBASE FUNCTIONS
# firebase functions:delete $(firebase functions:list -P ${PROJECT_ID} --json | jq -r '.result.[].id' | tr '\n' ' ') -f

# DELETE FIRESTORE DEFAULT DATABASE
# gcloud firestore databases delete --database="(default)" --project=${PROJECT_ID}

# DELETE FIREBASE WEB APP (_not_ Firebase project)
# delete from firebase console

# DELETE PROJECT BUDGET ALERT, IF ANY
# delete from gcloud console

# DELETE GCLOUD LOGGING ALERT, IF ANY
# delete from gcloud console

# DELETE BUDGET PUBSUB TOPIC
# gcloud pubsub topics list --project ${PROJECT_ID} | grep budget
# gcloud pubsub topics delete [TOPIC_NAME] --project ${PROJECT_ID}

# DELETE SHEETS & GITHUB ACTION SERVICE ACCOUNTS
# gcloud iam service-accounts list --project ${PROJECT_ID}
# gcloud iam service-accounts delete sheets@${PROJECT_ID}.iam.gserviceaccount.com
# gcloud iam service-accounts delete github-action-844354723@${PROJECT_ID}.iam.gserviceaccount.com

# DELETE GOOGLE PLACES API KEY
# gcloud services api-keys list --project ${PROJECT_ID}
# gcloud services api-keys delete [KEY_ID] --project ${PROJECT_ID}

# DELETE RECAPTCHA KEYS
# gcloud recaptcha keys list --project ${PROJECT_ID}
# gcloud recaptcha keys delete [KEY_ID] --project ${PROJECT_ID}

# DELETE STORAGE BUCKETS
# gsutil ls -p ${PROJECT_ID}
# gsutil rm -r [BUCKET_NAME]
