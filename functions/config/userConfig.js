const backendConfig = {
  event: {
    title: "Example Event Title",
    title_with_year: "Example Event Title 2025" // must match frontend config
  },
  registration: {
    waitlist_mode: false
  },
  spreadsheet: {
    fieldOrder: ['key', 'first', 'last', 'nametag', 'pronouns', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'age', 'share', 'allergies', 'carpool', 'bedding', 'volunteer', 'housing', 'roommate', 'misc', 'comments', 'admission', 'donation', 'total', 'deposit', 'fees', 'paid', 'charged', 'status', 'purchaser', 'completedAt', 'paymentId', 'paymentEmail', 'environment']
  },
  payment: {
    processor: 'stripe', // stripe|paypal
    statementDescriptorSuffix: '' // stripe-only (max 22 chars)
  },
  system: {
    region: 'us-west1', // leave as 'us-west1' unless Firebase/GCP project was created in another region
    timezone: 'America/Los_Angeles'
  }
};

export default backendConfig;