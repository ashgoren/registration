// You should not need to modify this file.
// Modify config in userConfig.js instead.

import userConfig from '../userConfig.js';

// deployOptions are needed before doppler secrets can be parsed
export const deployOptions = {
  REGION: userConfig.system.region,
  TIMEZONE: userConfig.system.timezone,
  DOPPLER_SECRETS: ['backend']
};

const baseOptions = {
  PAYMENT_PROCESSOR: userConfig.payment.processor,
  EVENT_TITLE: userConfig.event.title,
  EVENT_TITLE_WITH_YEAR: userConfig.event.title_with_year,
  STRIPE_STATEMENT_DESCRIPTOR_SUFFIX: userConfig.payment.statementDescriptorSuffix,
  FIELD_ORDER: userConfig.spreadsheet.fieldOrder,
  SHEETS_EMAIL_COLUMN: userConfig.spreadsheet.fieldOrder.indexOf('email'),
  SHEETS_KEY_COLUMN: 0,
  SHEETS_SHEET_RANGE: 'A:AZ',
  SHEETS_ORDERS_TAB_NAME: 'Orders',
  WAITLIST_MODE: userConfig.registration.waitlist_mode
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
  'SHEETS_SERVICE_ACCOUNT_KEY',
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
  if (process.env.DOPPLER_ENVIRONMENT !== 'dev') {
    console.log('DEBUG: parsing backend');
    try {
      parsedSecrets = JSON.parse(process.env.backend);
    } catch {
      throw new Error('Malformed backend environment variable');
    }
  } else {
    console.log('DEBUG: using env variables');
    parsedSecrets = envVariables.reduce((acc, varName) => {
      acc[varName] = process.env[varName];
      return acc;
    }, {});
  }

  const { FIRESTORE_EMULATOR_HOST, FUNCTIONS_EMULATOR, GCLOUD_PROJECT } = process.env;

  const PROJECT_ID = GCLOUD_PROJECT;
  const IS_SANDBOX = PROJECT_ID.includes('-stg');
  const IS_EMULATOR = !!FIRESTORE_EMULATOR_HOST || !!FUNCTIONS_EMULATOR;
  const ENV = IS_EMULATOR ? 'dev' : IS_SANDBOX ? 'stg' : 'prd';
  const PAYMENT_DESCRIPTION = ENV === 'prd' ? baseOptions.EVENT_TITLE_WITH_YEAR : `${baseOptions.EVENT_TITLE_WITH_YEAR} - ${ENV}`;

  config = {
    ...deployOptions,
    ...baseOptions,
    ...parsedSecrets,
    PROJECT_ID,
    IS_SANDBOX,
    IS_EMULATOR,
    ENV,
    PAYMENT_DESCRIPTION
  };

  return config;
};
