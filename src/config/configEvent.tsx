const config = {
  placeholder: false, // when true (and only on the prd env), replaces the registration flow with the Placeholder page

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

  navbar: {
    title: 'Example Event Title Registration', // navbar title text, same as the companion static site's (static-site-kit `title` prop); '' to show only the brand logo
    shortTitle: '', // abbreviated title shown only at medium widths (768-1023px), where it competes with the links for space; '' to always show the full title
    brand: '', // logo image path shown before the title (e.g. '/logo.png'); '' for no logo
    brandWidth: 40, // logo width & height in px, same as the companion static site's brand image `width` & `height` props; scales down proportionally if the screen is too narrow
    brandHeight: 40,
    centerLinksOnPage: false, // true centers links on the full navbar width (aligned with centered page content) rather than between the title and controls; can overlap the title if links are long
    tinted: true, // tint the navbar background with the accent color; false to use the page background
    // Navbar links, copied as-is from the companion static site's `links` (e.g. { label: 'About', href: '/about' }).
    // Root-relative hrefs point to pages on the static site (at links.info); full URLs are used unchanged.
    // Add `current: true` to the link to highlight (e.g. the static site's Registration link).
    // Leave empty for a standalone deployment with no companion site.
    links: [] as { label: string; href: string; current?: boolean }[],
  },

  nametags: {
    includePronouns: true,
    includeLastName: true
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
    processorFees: { // per-transaction rate; PayPal standard: 3.49% + $0.49, Stripe standard: 2.9% + $0.30
      percent: 0.0349,
      fixed: 0.49
    },
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