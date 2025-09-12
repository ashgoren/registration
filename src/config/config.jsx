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
import configStaticPages from './configStaticPages';
import configEnv from './configEnv';
import { FIELD_CONFIG } from './configFields';
const { SKIP_MANDATORY_FIELDS } = configBasics;

// TEMP hardcoding in here
const PERSON_CONTACT_FIELDS = ['first', 'last', 'nametag', 'pronouns', 'email', 'emailConfirmation', 'phone', 'address', 'apartment', 'city', 'state', 'zip', 'country'];
const PERSON_MISC_FIELDS_REAL = ['share', 'dietaryPreferences', 'dietaryRestrictions', 'allergies', 'carpool', 'bedding', 'volunteer', 'housing', 'roommate', 'photo', 'photoComments', 'agreement', 'comments'];
const PERSON_MISC_FIELDS = SKIP_MANDATORY_FIELDS ? PERSON_MISC_FIELDS_REAL.filter(f => !FIELD_CONFIG[f]?.required) : PERSON_MISC_FIELDS_REAL;

const PERSON_PAYMENT_FIELDS = ['admission'];

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
  ...configEnv,
  ...configSystem,
  ...configPaypal,
  ...configBasics,
  ...configTheme,
  ...configContent,
  ...configOrderSummary,
  ...configStaticPages,
  FIELD_CONFIG,
  PERSON_CONTACT_FIELDS,
  PERSON_MISC_FIELDS,
  PERSON_FIELDS,
  PERSON_DEFAULTS,
  getOrderDefaults
};
