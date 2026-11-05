#!/bin/bash

# Pauses a project between events so nothing publicly reachable is left running.
#
# - Deletes every deployed Cloud Function in production and staging. Functions are the only
#   publicly callable backend: Firestore rules deny all client access, and Cloud Build,
#   Eventarc, and Cloud Scheduler can't be triggered from outside. Scheduler jobs and
#   Eventarc triggers created by the functions are deleted along with them.
# - Disables the Places and Maps APIs. The browser API key for address autocomplete ships in
#   the public frontend bundle, and its referrer restriction can be spoofed outside a browser.
# - Disables the deploy workflow. It deploys functions on every push to main/staging, so
#   leaving it enabled would quietly recreate the deleted functions on the next commit.
#
# Firebase Hosting keeps serving the frontend, Firestore data is untouched, and Terraform-managed
# resources stay in place. Undo with `npm run resume <PROJECT_ID>`.

PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
  echo "npm run pause <project_id>"
  echo ""
  exit 1
fi

STAGING_PROJECT_ID=${PROJECT_ID}-stg

# The firebase CLI, gcloud, and gh each hold their own login. Checking gcloud up front avoids
# deleting functions (firebase login) and then failing partway on an expired gcloud session.
# Every step below is safe to re-run, so after a failure the whole script can simply run again.
gcloud auth print-access-token >/dev/null || { echo "❌ gcloud login expired: run 'gcloud auth login'"; exit 1; }

# Deleting functions goes through the Cloud Functions/Run APIs, so this has to happen while
# they're still enabled. `-P` is needed on the delete as well as the list: without it the delete
# targets the .firebaserc default project (staging) regardless of which project was listed.
for PROJECT in $PROJECT_ID $STAGING_PROJECT_ID; do
  FUNCTIONS=$(firebase functions:list -P $PROJECT --json | jq -r '.result.[].id' | tr '\n' ' ')
  if [ -n "${FUNCTIONS// /}" ]; then
    firebase functions:delete $FUNCTIONS -P $PROJECT -f \
      && echo "✅ Deleted functions in $PROJECT" \
      || { echo "❌ Failed to delete functions in $PROJECT"; exit 1; }
  else
    echo "No functions deployed in $PROJECT"
  fi
done

for PROJECT in $PROJECT_ID $STAGING_PROJECT_ID; do
  gcloud services disable places.googleapis.com maps-backend.googleapis.com --project $PROJECT \
    && echo "✅ Disabled Places and Maps APIs in $PROJECT" \
    || { echo "❌ Failed to disable Places and Maps APIs in $PROJECT"; exit 1; }
done

gh workflow disable firebase-hosting-merge.yml \
  && echo "✅ Disabled deploy workflow" \
  || { echo "❌ Failed to disable deploy workflow"; exit 1; }
