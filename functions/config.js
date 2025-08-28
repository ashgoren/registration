const options = {
  PAYMENT_PROCESSOR: "paypal",
  EVENT_TITLE: "Example Contra Weekend 2025",
  STRIPE_STATEMENT_DESCRIPTOR_SUFFIX: "max 22 characters",
  SHEETS_SHEET_RANGE: "A:AZ",
  SHEETS_KEY_COLUMN: "0",
  SHEETS_EMAIL_COLUMN: "5",
  SHEETS_SHEET_ID: "1E6a7o__Pil1GIb3XB_iuy5klfm1nGOc8wVHWwai7sqU",
  SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL: "sheets@contra-testing.iam.gserviceaccount.com",
  EMAIL_SUBJECT: "Example Contra Weekend Registration",
  EMAIL_ENDPOINT: "email-smtp.us-east-2.amazonaws.com",
  REGION: 'us-central1', // also set in Doppler on client-side
  TIMEZONE: 'America/Los_Angeles'
};

const envVariables = [
  'SANDBOX_MODE',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAPERTRAIL_TOKEN',
  'SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY',
  'CLOUD_FUNCTIONS_TRIGGER_TOKEN',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'EMAIL_IGNORE_TEST_DOMAINS',
  'EMAIL_NOTIFY_TO'
];

const functionsEnv = envVariables.reduce((acc, varName) => {
  acc[varName] = process.env[varName];
  return acc;
}, {});

export const config = { ...options, ...functionsEnv };
