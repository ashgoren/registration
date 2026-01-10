// You should not need to modify this file.
// Modify config in userConfig.js instead.

import userConfig from '../userConfig.js';

interface Config {
  // Deploy options
  REGION: string;
  TIMEZONE: string;
  DOPPLER_SECRETS: string[];
  
  // Base options
  PAYMENT_PROCESSOR: string;
  EVENT_TITLE: string;
  EVENT_TITLE_WITH_YEAR: string;
  STRIPE_STATEMENT_DESCRIPTOR_SUFFIX: string;
  FIELD_ORDER: string[];
  SHEETS_EMAIL_COLUMN: number;
  SHEETS_KEY_COLUMN: number;
  SHEETS_SHEET_RANGE: string;
  SHEETS_ORDERS_TAB_NAME: string;
  WAITLIST_MODE: boolean;
  WAITLIST_CUTOFF: number;
  TIMESTAMP_FORMAT: Intl.DateTimeFormatOptions;
  
  // Secrets
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  CLOUD_FUNCTIONS_TRIGGER_TOKEN?: string;
  SHEETS_SHEET_ID: string;
  SHEETS_SERVICE_ACCOUNT_KEY: string;
  EMAIL_ENDPOINT: string;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;
  EMAIL_FROM: string;
  EMAIL_REPLY_TO?: string;
  EMAIL_IGNORE_TEST_DOMAINS?: string;
  EMAIL_NOTIFY_TO: string;
  DOCUSEAL_KEY?: string;
  DOCUSEAL_TEMPLATE_ID?: string;
  
  // Computed
  PROJECT_ID: string;
  IS_SANDBOX: boolean;
  IS_EMULATOR: boolean;
  ENV: 'dev' | 'stg' | 'prd';
  PAYMENT_DESCRIPTION: string;
}

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
  WAITLIST_MODE: userConfig.registration.waitlist_mode,
  WAITLIST_CUTOFF: userConfig.registration.waitlist_cutoff,
  TIMESTAMP_FORMAT: userConfig.spreadsheet.timestampFormat
};

const envVariables = [
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_WEBHOOK_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUD_FUNCTIONS_TRIGGER_TOKEN',
  'SHEETS_SHEET_ID',
  'SHEETS_SERVICE_ACCOUNT_KEY',
  'EMAIL_ENDPOINT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'EMAIL_IGNORE_TEST_DOMAINS',
  'EMAIL_NOTIFY_TO',
  'DOCUSEAL_KEY',
  'DOCUSEAL_TEMPLATE_ID'
];

let config: Config | null = null;

export const getConfig = () => {
  if (config) return config;

  let parsedSecrets = {};
  if (process.env.DOPPLER_ENVIRONMENT !== 'dev') {
    console.log('DEBUG: parsing backend');
    try {
      parsedSecrets = JSON.parse(process.env.backend!);
    } catch {
      throw new Error('Malformed backend environment variable');
    }
  } else {
    console.log('DEBUG: using env variables');
    parsedSecrets = envVariables.reduce<Record<string, string | undefined>>((acc, varName) => {
      acc[varName] = process.env[varName];
      return acc;
    }, {});
  }

  const { FIRESTORE_EMULATOR_HOST, FUNCTIONS_EMULATOR, GCLOUD_PROJECT } = process.env;

  const PROJECT_ID = GCLOUD_PROJECT as string;
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
  } as Config;

  return config;
};
