import { fieldConfig } from './configFields';

const miscMapping = [
  { label: "Minor", value: 'minor' },
  { label: "No photos", value: 'no-photos' },
  { label: "I am interested in a beginner's lesson", value: 'beginner' },
];

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
    property: 'age',
    label: 'Age',
    mapping: fieldConfig['age'].options
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
    property: 'misc',
    label: 'Do any of these apply?',
    mapping: miscMapping
  },
  {
    property: 'comments',
    label: 'Comments'
  }
];

const config = { ORDER_SUMMARY_OPTIONS };
export default config;