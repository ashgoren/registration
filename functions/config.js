// deployOptions are needed before doppler secrets can be parsed
export const deployOptions = {
  REGION: 'us-west1',
  TIMEZONE: 'America/Los_Angeles',
  DOPPLER_SECRETS: ['backend']
};

const baseOptions = {
  PAYMENT_PROCESSOR: 'stripe',
  EVENT_TITLE: 'Example Contra Weekend 2025',
  EMAIL_SUBJECT: 'Example Contra Weekend Registration',
  STRIPE_STATEMENT_DESCRIPTOR_SUFFIX: '', // max 22 chars
  SHEETS_SHEET_RANGE: 'A:AZ',
  SHEETS_KEY_COLUMN: '0',
  SHEETS_EMAIL_COLUMN: '5'
};

const envVariables = [
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAPERTRAIL_TOKEN',
  'CLOUD_FUNCTIONS_TRIGGER_TOKEN',
  'SHEETS_SHEET_ID',
  'SHEETS_SERVICE_ACCOUNT_CLIENT_EMAIL',
  'SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY',
  'EMAIL_ENDPOINT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'EMAIL_IGNORE_TEST_DOMAINS',
  'EMAIL_NOTIFY_TO'
];

let config = null;
export const getConfig = () => {
  if (config) return config;

  let parsedSecrets = {};
  if (process.env.backend) {
    try {
      parsedSecrets = JSON.parse(process.env.backend);
    } catch (error) {
      throw new Error('Malformed backend environment variable');
    }
  } else {
    parsedSecrets = envVariables.reduce((acc, varName) => {
      acc[varName] = process.env[varName];
      return acc;
    }, {});
  }

  const { FIREBASE_AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST, FUNCTIONS_EMULATOR, GCLOUD_PROJECT } = process.env;

  config = {
    ...deployOptions,
    ...baseOptions,
    ...parsedSecrets,
    PROJECT_ID: GCLOUD_PROJECT,
    IS_SANDBOX: GCLOUD_PROJECT.includes('-stg'),
    IS_EMULATOR: !!FIREBASE_AUTH_EMULATOR_HOST || !!FIRESTORE_EMULATOR_HOST || !!FUNCTIONS_EMULATOR
  };

  return config;
};
