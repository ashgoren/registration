import { fieldsConfig } from '../configFields';
import configEvent from '../configEvent.tsx';
import configEnv from './configEnv';
import type { Order, Person } from '@registration/types';

const contactFields = configEvent.registration.fields.contact;
const miscFields = configEvent.registration.fields.misc;
const paymentFields = ['admission'];

const personFields = [...contactFields, ...miscFields, ...paymentFields];

const personDefaults = personFields.reduce((obj, field) => ({ ...obj, [field]: fieldsConfig[field]?.defaultValue }), {}) as Person;

const getOrderDefaults = (): Order => ({
  people: [personDefaults],
  donation: 0,
  deposit: 0,
  paymentId: null,
  paymentEmail: null,
  charged: null,
  total: null,
  fees: null,
  environment: configEnv.env
});

const personInputLabels = [
  'Your contact information',
  'Second person',
  'Third person',
  'Fourth person',
  'Fifth person',
  'Sixth person',
  'Seventh person',
  'Eighth person'
];

export default {
  contactFields,
  miscFields,
  personFields,
  personDefaults,
  fieldsConfig,
  getOrderDefaults,
  personInputLabels
}