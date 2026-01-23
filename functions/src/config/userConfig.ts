const backendConfig = {
  event: {
    title: "Example Event Title",
    title_with_year: "Example Event Title 2025" // must match frontend config
  },
  registration: {
    waitlist_mode: false,
    waitlist_cutoff: 240
  },
  spreadsheet: {
    fieldOrder: ['key', 'first', 'last', 'nametag', 'pronouns', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'age', 'share', 'allergies', 'carpool', 'bedding', 'volunteer', 'housing', 'roommate', 'misc', 'comments', 'admission', 'donation', 'total', 'deposit', 'fees', 'paid', 'charged', 'status', 'purchaser', 'completedAt', 'paymentId', 'paymentEmail', 'waiver', 'environment'],
    timestampFormat: { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
  },
  payment: {
    processor: 'paypal', // stripe|paypal
    statementDescriptorSuffix: '' // stripe-only (max 22 chars)
  },
  system: {
    region: 'us-west1', // leave as 'us-west1' unless Firebase/GCP project was created in another region
    timezone: 'America/Los_Angeles'
  }
} as const;

export default backendConfig;