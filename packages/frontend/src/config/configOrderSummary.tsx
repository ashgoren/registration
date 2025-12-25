import { fieldsConfig } from './configFields';

const miscMapping = [
  { label: "Minor", value: 'minor' },
  { label: "No photos", value: 'no-photos' },
  { label: "I am interested in a beginner's lesson", value: 'beginner' },
];

const orderSummaryOptions = [
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
    mapping: fieldsConfig['age'].options
  },
  {
    property: 'share',
    label: 'Include on roster',
    defaultValue: 'do not share'
  },
  {
    property: 'dietaryPreferences',
    label: 'Dietary Preferences',
    mapping: fieldsConfig['dietaryPreferences'].options
  },
  {
    property: 'dietaryRestrictions',
    label: 'Dietary Restrictions',
    mapping: fieldsConfig['dietaryRestrictions'].options
  },
  {
    property: 'allergies',
    label: 'Allergies'
  },
  {
    property: 'carpool',
    label: 'Transportation',
    mapping: fieldsConfig['carpool'].options
  },
  {
    property: 'bedding',
    label: 'Bedding',
    mapping: fieldsConfig['bedding'].options
  },
  {
    property: 'volunteer',
    label: 'Volunteering',
    mapping: fieldsConfig['volunteer'].options
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

export default { orderSummaryOptions };