// *********************************************************************************************
// *** NOTE: if change form fields may also need to update OrderSummary and validationSchema ***
// *** ALSO: if add fields, be sure to add them to export at the end of this file            ***
// *********************************************************************************************

import { PAYPAL_OPTIONS } from './configPaypal';
import { FIELD_CONFIG, PERSON_INPUT_LABELS } from './configFields';
import { VOLUNTEER_OPTIONS, SCHOLARSHIP_OPTIONS, SHARE_OPTIONS, YES_NO_OPTIONS, DANCES } from './configContent';

// update these as needed
const ADMISSION_COST_RANGE = [100, 150];
const ADMISSION_COST_DEFAULT = 100;
const ADMISSION_QUANTITY_MAX = 4;
const DONATION_OPTION = true;
const DONATION_RANGE = [0, 999];

// config for this particular registration instance; update this as needed!
const PERSON_CONTACT_FIELDS = ['first', 'last', 'nametag', 'pronouns', 'email', 'phone', 'address', 'apartment', 'city', 'state', 'zip', 'country'];
const PERSON_MISC_FIELDS = ['share', 'carpool', 'volunteer', 'scholarship', 'comments'];
const ORDER_MISC_DEFAULTS = {
  emailConfirmation: '',
  admissionCost: ADMISSION_COST_DEFAULT,
  donation: DONATION_RANGE[0]
};

// don't change these
const i = PERSON_CONTACT_FIELDS.indexOf('phone');
const FIRST_PERSON_CONTACT_FIELDS = [ ...PERSON_CONTACT_FIELDS.slice(0, i), 'emailConfirmation', ...PERSON_CONTACT_FIELDS.slice(i) ];
const PERSON_FIELDS = [...PERSON_CONTACT_FIELDS, ...PERSON_MISC_FIELDS];
const PERSON_DEFAULTS = PERSON_FIELDS.reduce((obj, field) => ({ ...obj, [field]: FIELD_CONFIG[field].defaultValue }), {});
const ORDER_DEFAULTS = {
  ...ORDER_MISC_DEFAULTS,
  people: [PERSON_DEFAULTS]
}

// *********************************************************************************************
// ***                           Export fields here if added fields above!                   ***
// *********************************************************************************************
const config = {
  SANDBOX_MODE: false, // for testing only
  SHOW_PRE_REGISTRATION: false,
  NUM_PAGES: 2,
  STEPS: [
    {key: 1, label: 'Contact'},
    {key: 2, label: 'Payment'},
    {key: 'checkout', label: 'Checkout'}
  ],
  PAYMENT_METHODS: ['stripe', 'check'], // options are 'stripe', 'paypal', and/or 'check' (first is default)
  EVENT_TITLE: 'Example Contra Weekend',
  EVENT_LOCATION: 'Someplace, Somewhere',
  EVENT_LOCATION_2: 'Some address',
  EVENT_DATE: 'Some dates',
  TITLE: 'Example Contra Weekend 2024 Registation',
  CONFIRMATION_PAYPAL_TITLE: 'Example Dance Weekend Confirmation',
  CONFIRMATION_CHECK_TITLE: 'Example Dance Weekend Registration',
  EMAIL_CONTACT: 'contact@example.com',
  COVID_POLICY_URL: 'example.com/covid',
  SAFETY_POLICY_URL: 'example.com/safety',
  CHECK_TO: 'Check To Example',
  CHECK_ADDRESS: "Address line 1<br />Address line 2<br />Address line 3<br />Address line 4",
  ADMISSION_COST_RANGE,
  ADMISSION_COST_DEFAULT,
  ADMISSION_QUANTITY_MAX,
  DONATION_OPTION,
  DONATION_RANGE,
  PAYPAL_OPTIONS,
  FIELD_CONFIG,
  PERSON_CONTACT_FIELDS,
  FIRST_PERSON_CONTACT_FIELDS,
  PERSON_MISC_FIELDS,
  PERSON_DEFAULTS,
  PERSON_INPUT_LABELS,
  ORDER_DEFAULTS,
  VOLUNTEER_OPTIONS,
  SCHOLARSHIP_OPTIONS,
  SHARE_OPTIONS,
  YES_NO_OPTIONS,
  DANCES,
  CAPTCHA_KEY: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
}

export default config;
