PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
  echo "npm run disable-apis <project_id>"
  echo ""
  exit 1
fi

gcloud services disable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com places.googleapis.com cloudscheduler.googleapis.com cloudfunctions.googleapis.com --project $PROJECT_ID
gcloud services disable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com places.googleapis.com cloudscheduler.googleapis.com cloudfunctions.googleapis.com --project $PROJECT_ID-stg
gcloud secrets delete backend --project $PROJECT_ID -q
gcloud secrets delete backend --project $PROJECT_ID-stg -q
