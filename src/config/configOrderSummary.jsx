import { FIELD_CONFIG } from './configFields';

const config = {
  ORDER_SUMMARY_OPTIONS: [
    { property: 'nametag', label: 'Name for roster' },
    { property: 'email', label: 'Email' },
    { property: 'phone', label: 'Phone' },
    { property: 'address', label: 'Address' },
    { property: 'share', label: 'Include on roster', defaultValue: 'do not share' },
    { property: 'dietaryPreferences', label: 'Dietary Preferences', mapping: FIELD_CONFIG['dietaryPreferences'].options },
    { property: 'dietaryRestrictions', label: 'Dietary Restrictions', mapping: FIELD_CONFIG['dietaryRestrictions'].options},
    { property: 'allergies', label: 'Allergies' },
    { property: 'carpool', label: 'Transportation', mapping: FIELD_CONFIG['carpool'].options },
    { property: 'bedding', label: 'Bedding', mapping: FIELD_CONFIG['bedding'].options },
    { property: 'volunteer', label: 'Volunteering', mapping: FIELD_CONFIG['volunteer'].options },
    { property: 'housing', label: 'Housing' },
    { property: 'roommate', label: 'Roommate' },
    { property: 'photo', label: 'Photo Consent' },
    { property: 'comments', label: 'Comments' },
  ]
}

export default config;
