// *********************************************************************************************
// ***                  You shouldn't need to actually modify this file!                     ***
// ***                      Configure in other files in this folder.                         ***
// *********************************************************************************************

import configSystem from './configSystem';
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
  people: [PERSON_DEFAULTS]
});

export const config = {
  ...configSystem,
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