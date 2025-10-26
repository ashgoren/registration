import { fieldConfig } from '../configFields';
import userConfig from '../configEvent.tsx';
const { dev, registration } = userConfig;
const isDev = import.meta.env.DEV;

const contactFields = registration.fields.contact;
const miscFields = isDev && dev.skip_mandatory_fields ? registration.fields.misc.filter(f => !fieldConfig[f]?.required) : registration.fields.misc;
const paymentFields = ['admission'];
const personFields = [...contactFields, ...miscFields, ...paymentFields];

const personDefaults = personFields.reduce((obj, field) => ({ ...obj, [field]: fieldConfig[field]?.defaultValue }), {});

const getOrderDefaults = () => ({
  people: [personDefaults],
  donation: 0,
  deposit: 0
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