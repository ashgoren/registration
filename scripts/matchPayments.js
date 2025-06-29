import dotenv from 'dotenv';
dotenv.config();
const { VITE_FUNCTIONS_REGION, CLOUD_FUNCTIONS_TRIGGER_TOKEN, VITE_FIREBASE_PROJECT_ID } = process.env;

console.log('Triggering matchPayments function...');

const url = `https://${VITE_FUNCTIONS_REGION}-${VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/matchPaymentsOnDemand`;
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': CLOUD_FUNCTIONS_TRIGGER_TOKEN,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({}),
});

if (!response.ok) {
  console.error(`Error: ${response.status} ${response.statusText}`);
}

const data = await response.json();
console.log(data.data || data.message || data.error || 'No data returned');
