const config = {
  dev: {
    skip_mandatory_fields: true,
    use_firebase_emulator: true
  },

  event: {
    title: "NW New Year's Camp 2025", // also must set in backend config
    location: "Camp Sealth Vashon Island Washington",
    date: "Monday December 29 2025 - Thursday January 1 2026"
  },

  registration: {
    registration_only: true,
    waitlist_mode: false,
    show_preregistration: false,
    admission_quantity_max: 4,
    static_pages: ['Home', 'About', 'Staff', 'Seattle', 'Contact', 'Schedule', 'PaymentExplanation'], // These must exist in src/components/static
    fields: { // Order of form fields
      contact: ['first', 'last', 'nametag', 'pronouns', 'email', 'emailConfirmation', 'phone', 'address', 'apartment', 'city', 'state', 'zip', 'country'],
      misc: ['share', 'dietaryPreferences', 'dietaryRestrictions', 'allergies', 'carpool', 'bedding', 'volunteer', 'housing', 'roommate', 'photo', 'photoComments', 'agreement', 'comments']
    }
  },

  nametags: {
    include_pronouns: false,
    include_last_name: true
  },

  payments: {
    processor: 'stripe', // stripe|paypal - also must set in backend config
    payment_due_date: 'Example Payment Due Date',
    direct_payment_url: 'example.com/directpayment', // electronic payment option to pay remaining balance after selecting deposit or check payment
    cover_fees_checkbox: true,
    checks: {
      allowed: true, // If false, the below fields are ignored
      show_postal_address: false, // If false, shows contact email
      payee: 'Example Check Payee Name',
      address: ['Line 1', 'Line 2', 'Line 3', 'Line 4']
    }
  },

  pricing: {
    cost_range: [125, 650],
    cost_default: 380,
    deposit: {
      enabled: false,
      amount: 50 // ignored if disabled
    },
    donation: {
      enabled: true,
      max: 999 // ignored if disabled
    }
  },

  contacts: {
    info: 'registrar@bashonvashon.org',
    tech: 'ash@pdxcontra.org'
  },

  external_links: {
    more_info: 'bashonvashon.org',
    policies: {
      covid: 'example.com/covid',
      safety: 'example.com/safety'
    }
  }
};

export default config;