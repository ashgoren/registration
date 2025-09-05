PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
  echo "npm run enable-apis <project_id>"
  echo ""
  exit 1
fi

gcloud services enable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com places.googleapis.com mapsjs.googleapis.com --project $PROJECT_ID
