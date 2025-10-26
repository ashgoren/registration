import { fieldConfig } from '../configFields';
import userConfig from '../configEvent.tsx';
import envConfig from './configEnv';

const { dev, registration } = userConfig;
const { ENV } = envConfig;

const contactFields = registration.fields.contact;
const miscFields = ENV === 'dev' && dev.skip_mandatory_fields ? registration.fields.misc.filter(f => !fieldConfig[f]?.required) : registration.fields.misc;
const paymentFields = ['admission'];
const personFields = [...contactFields, ...miscFields, ...paymentFields];

const personDefaults = personFields.reduce((obj, field) => ({ ...obj, [field]: fieldConfig[field]?.defaultValue }), {});

const getOrderDefaults = () => ({
  people: [personDefaults],
  donation: 0,
  deposit: 0,
  paymentId: null as string | null,
  paymentEmail: null as string | null,
  charged: null as number | null,
  total: null as number | null,
  fees: null as number | null,
  environment: ENV as 'dev' | 'stg' | 'prd'
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