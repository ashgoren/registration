const config = {
  productionMode: false,

  event: {
    title: 'Example Event Title',
    titleWithYear: 'Example Event Title 2025', // must match backend config
    location: 'Example Event Location, City, State',
    date: 'Example Event Dates',
    timezone: 'America/Los_Angeles'
  },

  calendar: {
    title: 'Example Event Title',
    description: 'Join us for an exciting event! More details at https://example.com',
    location: 'Example Event Location, City, State',
    start: '2025-10-03T19:00:00-07:00', // ISO 8601 format
    end: '2025-10-05T15:00:00-07:00' // ISO 8601 format
  },

  contacts: {
    info: 'info@example.com',
    tech: 'tech@example.com',
    housing: 'housing@example.com'
  },

  links: {
    info: 'example.com',
    policies: {
      covid: 'example.com/covid',
      safety: 'example.com/safety'
    }
  },

  nametags: {
    includePronouns: true,
    includeLastName: true
  },

  staticPages: {
    enabled: false,
    components: ['Home', 'About', 'Staff', 'Seattle', 'Contact', 'Schedule', 'PaymentExplanation'], // These must exist in src/components/Static
  },

  registration: {
    waitlistMode: false,
    showPreregistration: false,
    showWaiver: false,
    admissionQuantityMax: 4,
    fields: { // Order of form fields
      contact: ['first', 'last', 'nametag', 'pronouns', 'email', 'emailConfirmation', 'phone', 'address', 'apartment', 'city', 'state', 'zip', 'country'],
      misc: ['share', 'allergies', 'carpool', 'bedding', 'volunteer', 'housing', 'roommate', 'misc', 'miscComments', 'agreement', 'comments']
    }
  },

  admissions: {
    mode: 'sliding-scale', // sliding-scale|fixed|tiered
    slidingScale: {
      costRange: [120, 500],
      costDefault: 350
    },
    fixed: {
      cost: 200
    },
    tiered: {
      earlybirdCutoff: '2025-11-10', // last day to get early pricing
    }
  },

  payments: {
    processor: 'paypal', // stripe|paypal - also must set in backend config
    paymentDueDate: 'Example Payment Due Date',
    directPaymentUrl: 'example.com/directpayment', // electronic payment option to pay remaining balance after selecting deposit or check payment
    coverFeesCheckbox: true,
    showPaymentSummary: true, // show summary of costs in payment section
    deposit: {
      enabled: true,
      amount: 50 // ignored if disabled
    },
    donation: {
      enabled: true,
      max: 999 // ignored if disabled
    },
    checks: {
      allowed: true, // If false, the below fields are ignored
      showPostalAddress: false, // If false, shows contact email
      payee: 'Example Check Payee Name',
      address: ['Line 1', 'Line 2', 'Line 3', 'Line 4']
    }
  }
};

export default config;