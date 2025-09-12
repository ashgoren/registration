import { fieldConfig } from './configFields';

const ORDER_SUMMARY_OPTIONS = [
  {
    property: 'nametag',
    label: 'Name for roster'
  },
  {
    property: 'email',
    label: 'Email'
  },
  {
    property: 'phone',
    label: 'Phone'
  },
  {
    property: 'address',
    label: 'Address'
  },
  {
    property: 'share',
    label: 'Include on roster',
    defaultValue: 'do not share'
  },
  {
    property: 'dietaryPreferences',
    label: 'Dietary Preferences',
    mapping: fieldConfig['dietaryPreferences'].options
  },
  {
    property: 'dietaryRestrictions',
    label: 'Dietary Restrictions',
    mapping: fieldConfig['dietaryRestrictions'].options
  },
  {
    property: 'allergies',
    label: 'Allergies'
  },
  {
    property: 'carpool',
    label: 'Transportation',
    mapping: fieldConfig['carpool'].options
  },
  {
    property: 'bedding',
    label: 'Bedding',
    mapping: fieldConfig['bedding'].options
  },
  {
    property: 'volunteer',
    label: 'Volunteering',
    mapping: fieldConfig['volunteer'].options
  },
  {
    property: 'housing',
    label: 'Housing'
  },
  {
    property: 'roommate',
    label: 'Roommate'
  },
  {
    property: 'photo',
    label: 'Photo Consent'
  },
  {
    property: 'comments',
    label: 'Comments'
  }
];

const config = { ORDER_SUMMARY_OPTIONS };
export default config;