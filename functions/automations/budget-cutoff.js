// For testing manually trigger with a Pub/Sub message like this:
// {"budgetDisplayName":"TEST Shutdown Budget","costAmount":10.0,"costIntervalStart":"2025-06-01T07:00:00Z","budgetAmount":10.0,"budgetAmountType":"SPECIFIED_AMOUNT","currencyCode":"USD"}

// To check status of APIs:
// gcloud services list --enabled --project=contra-testing --filter="config.name:run.googleapis.com"
// gcloud services list --enabled --project=contra-testing --filter="config.name:firestore.googleapis.com"
// gcloud services list --enabled --project=contra-testing --filter="config.name:cloudbuild.googleapis.com"
// gcloud services list --enabled --project=contra-testing --filter="config.name:eventarc.googleapis.com"

// To re-enable APIs from gcloud CLI:
// gcloud services enable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com --project contra-testing

import { google } from 'googleapis';
import { sendMail } from '../shared/email.js';
import { PROJECT_ID } from '../shared/helpers.js';
// import 'dotenv/config'; // for local emulation, but breaks production deployment

const COST_THRESHOLD = 10;
const APIS_TO_DISABLE = [
  'run.googleapis.com', // 2nd Gen Firebase Functions
  'firestore.googleapis.com', // Firestore
  'cloudbuild.googleapis.com', // To stop builds
  'eventarc.googleapis.com' // To stop event triggers
];

// onMessagePublished to budget-cutoff topic
export const disableProjectAPIsHandler = async (event) => {
  if (!PROJECT_ID) {
    console.error('Missing required environment variable: PROJECT_ID');
    return;
  }

  // Early exit if Pub/Sub msg is invalid or costAmount is below threshold
  try {
    const costAmount = parseCostAmount(event);
    if (costAmount < COST_THRESHOLD) {
      console.log('Cost is below threshold, no action taken.');
      return; // Early exit if cost is below threshold
    }
    console.log(`Cost (${costAmount}) exceeds threshold, proceeding to disable APIs...`);
  } catch (error) {
    console.error('Error parsing Pub/Sub message:', error.message);
    return; // Early exit if invalid Pub/Sub message
  }
  
  // Continue with disabling APIs...

  const apis = APIS_TO_DISABLE.map(api => ({ name: api, success: false }));

  const serviceusage = await initializeGoogleServiceUsageClient();
  for (const api of apis) {
    const serviceName = `projects/${PROJECT_ID}/services/${api.name}`;
    try {
      console.log(`Disabling ${api.name}...`);
      await serviceusage.services.disable({
        name: serviceName,
        requestBody: { disableDependentServices: false },
      });
      console.log(`Successfully disabled ${api.name}.`);
      api.success = true;
    } catch (error) {
      if (error.code === 403) console.error(`Permission denied trying to disable ${api.name}.`);
      console.error(`Failed to disable ${api.name}:`, error);
    }
  }

  await logAndEmail(apis);
};

const parseCostAmount = (event) => {
  const msg = Buffer.from(event.data.message.data, 'base64').toString('utf-8');
  console.log('Received Pub/Sub message:', msg);
  try {
    const costAmount = parseFloat(JSON.parse(msg.trim()).costAmount);
    if (isNaN(costAmount)) {
      throw new Error('Cost amount is not a valid number');
    }
    console.log('Cost amount:', costAmount);
    return costAmount;
  } catch (error) {
    console.error('Error parsing Pub/Sub message:', error.message);
    throw error;
  }
}

const initializeGoogleServiceUsageClient = async () => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  return google.serviceusage({ version: 'v1', auth });
};

const logAndEmail = async (apis) => {
  const { PROJECT_ID, EMAIL_FROM, EMAIL_NOTIFY_TO } = process.env;
  if (!PROJECT_ID || !EMAIL_FROM || !EMAIL_NOTIFY_TO) {
    console.error('Unable to send email: Missing required environment variables');
    return;
  }

  const disabledApis = apis.filter(a => a.success).map(a => a.name).join(', ');
  const failedApis = apis.filter(a => !a.success).map(a => a.name).join(', ');

  if (apis.every(api => api.success)) {
    console.log('✅ All APIs disabled successfully.');
  } else {
    console.error(`❌ Some APIs could not be disabled: ${failedApis}`);
  }

  try {
    await sendMail({
      from: EMAIL_FROM,
      to: EMAIL_NOTIFY_TO,
      subject: `${PROJECT_ID} Budget Overrun: Emergency Shutdown!`,
      text: `Disabled APIs: ${disabledApis}\nFailed to disable: ${failedApis}`
    });
    console.log('Alert email sent successfully.');
  } catch (err) {
    console.error('Failed to send alert email:', err.message);
  }
};
