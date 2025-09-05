const devConfigOverrides = {
  SKIP_MANDATORY_FIELDS: true,
  USE_FIREBASE_EMULATOR: true,
};

const remoteConfigOverrides = {};

const baseConfig = {
  SKIP_MANDATORY_FIELDS: false,
  USE_FIREBASE_EMULATOR: false,
  WAITLIST_MODE: false,
  SHOW_PRE_REGISTRATION: false,
  REGISTRATION_ONLY: false,

  ADMISSION_QUANTITY_MAX: 4,
  ADMISSION_COST_RANGE: [125, 650],
  ADMISSION_COST_DEFAULT: 380,
  DEPOSIT_OPTION: true,
  DEPOSIT_COST: 50,
  DONATION_OPTION: true,
  COVER_FEES_OPTION: true,
  DONATION_MAX: 999,
  INCLUDE_PRONOUNS_ON_NAMETAG: false,
  INCLUDE_LAST_ON_NAMETAG: true,

  PAYMENT_METHODS: ['paypal', 'check'], // options are stripe|paypal|check (first is default)

  EVENT_TITLE: 'Example Contra Weekend 2025',
  EVENT_LOCATION: 'Example place, Example place',
  EVENT_LOCATION_2: 'Example address',
  EVENT_DATE: 'Example dates',
  TITLE: 'Example Contra Weekend 2025 Registration',
  CONFIRMATION_ELECTRONIC_TITLE: 'Example Dance Weekend Confirmation',
  CONFIRMATION_CHECK_TITLE: 'Example Dance Weekend Registration',
  EMAIL_CONTACT: 'contact@example.com',
  TECH_CONTACT: 'tech@example.com',
  MORE_INFO_URL: 'example.com/',
  COVID_POLICY_URL: 'example.com/covid',
  SAFETY_POLICY_URL: 'example.com/safety',
  DIRECT_PAYMENT_URL: 'example.com/directpayment',
  CHECK_TO: 'Example Check To',
  CHECK_ADDRESS: <>Example Address line 1<br />Example Address line 2<br />Example Address line 3<br />Example Address line 4</>,
  PAYMENT_DUE_DATE: 'Example Payment Due Date'
};

const exportWithOverrides = {
  ...baseConfig,
  ...(import.meta.env.DEV ? devConfigOverrides : remoteConfigOverrides)
};

export default exportWithOverrides;
