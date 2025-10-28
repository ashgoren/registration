import { fieldConfig } from '../configFields';
import userConfig from '../configEvent.tsx';
import envConfig from './configEnv';
import type { Order, Person } from 'types/order';

const { dev, registration } = userConfig;
const { ENV } = envConfig;

const contactFields = registration.fields.contact;
const miscFields = ENV === 'dev' && dev.skip_mandatory_fields ? registration.fields.misc.filter(f => !fieldConfig[f]?.required) : registration.fields.misc;
const paymentFields = ['admission'];
const personFields = [...contactFields, ...miscFields, ...paymentFields];

const personDefaults = personFields.reduce((obj, field) => ({ ...obj, [field]: fieldConfig[field]?.defaultValue }), {}) as Person;

const getOrderDefaults = (): Order => ({
  people: [personDefaults],
  donation: 0,
  deposit: 0,
  paymentId: null,
  paymentEmail: null,
  charged: null,
  total: null,
  fees: null,
  environment: ENV
});

const configFields = {
  PERSON_CONTACT_FIELDS: contactFields,
  PERSON_MISC_FIELDS: miscFields,
  PERSON_PAYMENT_FIELDS: paymentFields,
  PERSON_FIELDS: personFields,
  PERSON_DEFAULTS: personDefaults,
  FIELD_CONFIG: fieldConfig,
  getOrderDefaults
};

export default configFields;