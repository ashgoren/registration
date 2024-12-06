// *********************************************************************************************
// ***                  You shouldn't need to actually modify this file!                     ***
// *** Configure in configBasics, configContent, configOrderSummary and configPaypal files.  ***
// *** NOTE: if change form fields may also need to update OrderSummary and validationSchema ***
// *********************************************************************************************

import configPaypal from './configPaypal';
import configBasics from './configBasics';
import configTheme from './configTheme';
import configContent from './configContent';
import configOrderSummary from './configOrderSummary';
import { FIELD_CONFIG, PERSON_CONTACT_FIELDS, PERSON_MISC_FIELDS, PERSON_PAYMENT_FIELDS } from './configFields';

const PERSON_FIELDS = [...PERSON_CONTACT_FIELDS, ...PERSON_MISC_FIELDS, ...PERSON_PAYMENT_FIELDS];
const PERSON_DEFAULTS = PERSON_FIELDS.reduce((obj, field) => ({ ...obj, [field]: FIELD_CONFIG[field].defaultValue }), {});
const ORDER_MISC_DEFAULTS = {
  donation: 0,
  deposit: 0
};
const getOrderDefaults = () => ({
  ...ORDER_MISC_DEFAULTS,
  people: [PERSON_DEFAULTS],
  idempotencyKey: crypto.randomUUID()
});

const config = {
  ...configPaypal,
  ...configBasics,
  ...configTheme,
  ...configContent,
  ...configOrderSummary,
  FIELD_CONFIG,
  PERSON_CONTACT_FIELDS,
  PERSON_MISC_FIELDS,
  PERSON_FIELDS,
  PERSON_DEFAULTS,
  getOrderDefaults
}

export default config;
