import dotenv from 'dotenv';
dotenv.config();
const { VITE_CONFIG, CLOUD_FUNCTIONS_TRIGGER_TOKEN } = process.env;
const { FUNCTIONS_REGION, FIREBASE_PROJECT_ID } = JSON.parse(VITE_CONFIG);

console.log('Triggering matchPayments function...');

const url = `https://${FUNCTIONS_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net/matchPaymentsOnDemand`;
console.log(`Request URL: ${url}`);

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
