import { FIELD_CONFIG } from './configFields';

export const ORDER_SUMMARY_OPTIONS = [
  { property: 'nametag', label: 'Name for roster' },
  { property: 'email', label: '' },
  { property: 'phone', label: '' },
  { property: 'address', label: '' },
  { property: 'share', label: 'Include on roster', defaultValue: 'do not share' },
  { property: 'dietaryPreferences', label: 'Dietary Preferences', mapping: FIELD_CONFIG['dietaryPreferences'].options },
  { property: 'dietaryRestrictions', label: 'Dietary Restrictions', mapping: FIELD_CONFIG['dietaryRestrictions'].options},
  { property: 'allergies', label: 'Allergies' },
  { property: 'scent', label: 'Scent-free' },
  { property: 'carpool', label: 'Transportation', mapping: FIELD_CONFIG['carpool'].options },
  { property: 'bedding', label: 'Bedding', mapping: FIELD_CONFIG['bedding'].options },
  { property: 'volunteer', label: 'Volunteering', mapping: FIELD_CONFIG['volunteer'].options },
  { property: 'housing', label: 'Housing' },
  { property: 'roommate', label: 'Roommate' },
  { property: 'photo', label: 'Photo Consent' },
  { property: 'comments', label: 'Comments' },
  { property: 'admissionCost', label: 'Admission Cost' },
];
