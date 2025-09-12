const backendConfig = {
  event: {
    title: "NW New Year's Camp 2025"
  },
  spreadsheet: {
    fieldOrder: ['key', 'first', 'last', 'nametag', 'pronouns', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'share', 'dietaryPreferences', 'dietaryRestrictions', 'allergies', 'carpool', 'bedding', 'volunteer', 'housing', 'roommate', 'photo', 'comments', 'admission', 'donation', 'total', 'deposit', 'fees', 'paid', 'charged', 'status', 'purchaser', 'completedAt', 'paymentId', 'paymentEmail', 'isTestOrder']
  },
  payment: {
    processor: 'stripe',
    statementDescriptorSuffix: '' // stripe-only (max 22 chars)
  },
  system: {
    region: 'us-west1', // leave as-is unless Firebase/GCP project was created in another region
    timezone: 'America/Los_Angeles'
  }
};

export default backendConfig;