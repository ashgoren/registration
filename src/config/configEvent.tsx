const config = {
  prd: {
    live: false
  },

  dev: {
    skip_mandatory_fields: false,
    use_firebase_emulator: true
  },

  event: {
    title: 'Example Event Title',
    title_with_year: 'Example Event Title 2025', // must match backend config
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

  external_links: {
    more_info: 'example.com',
    policies: {
      covid: 'example.com/covid',
      safety: 'example.com/safety'
    }
  },

  nametags: {
    include_pronouns: false,
    include_last_name: true
  },

  static_pages: {
    enabled: true,
    components: ['Home', 'About', 'Staff', 'Seattle', 'Contact', 'Schedule', 'PaymentExplanation'], // These must exist in src/components/Static
  },

  registration: {
    waitlist_mode: false,
    show_preregistration: false,
    show_waiver: true,
    admission_quantity_max: 4,
    fields: { // Order of form fields
      contact: ['first', 'last', 'nametag', 'pronouns', 'email', 'emailConfirmation', 'phone', 'address', 'apartment', 'city', 'state', 'zip', 'country'],
      misc: ['age', 'share', 'allergies', 'carpool', 'bedding', 'volunteer', 'housing', 'roommate', 'misc', 'miscComments', 'agreement', 'comments']
    }
  },

  admissions: {
    mode: 'tiered', // sliding-scale|fixed|tiered
    sliding_scale: {
      cost_range: [120, 500],
      cost_default: 350
    },
    fixed: {
      cost: 200
    },
    tiered: {
      earlybird_cutoff: '2025-11-10', // last day to get early pricing
    }
  },

  payments: {
    processor: 'stripe', // stripe|paypal - also must set in backend config
    payment_due_date: 'Example Payment Due Date',
    direct_payment_url: 'example.com/directpayment', // electronic payment option to pay remaining balance after selecting deposit or check payment
    cover_fees_checkbox: true,
    show_payment_summary: true, // show summary of costs in payment section
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
      show_postal_address: false, // If false, shows contact email
      payee: 'Example Check Payee Name',
      address: ['Line 1', 'Line 2', 'Line 3', 'Line 4']
    }
  }
};

export default config;