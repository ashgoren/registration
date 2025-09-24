import userConfig from '../configEvent.jsx';
const { event, registration, nametags, payments, pricing, contacts, external_links } = userConfig;

const baseConfig = {
  STATIC_PAGES: registration.static_pages,

  WAITLIST_MODE: registration.waitlist_mode,
  SHOW_PRE_REGISTRATION: registration.show_preregistration,
  REGISTRATION_ONLY: registration.registration_only,

  PAYMENT_METHODS: payments.checks.allowed ? [payments.processor, 'check'] : [payments.processor],
  SHOW_PAYMENT_SUMMARY: payments.payment_summary,

  ADMISSION_QUANTITY_MAX: registration.admission_quantity_max,
  ADMISSION_COST_RANGE: pricing.cost_range,
  ADMISSION_COST_DEFAULT: pricing.cost_default,
  DEPOSIT_OPTION: pricing.deposit.enabled,
  DEPOSIT_COST: pricing.deposit.amount,
  DONATION_OPTION: pricing.donation.enabled,
  DONATION_MAX: pricing.donation.max,
  COVER_FEES_OPTION: payments.cover_fees_checkbox,
  DIRECT_PAYMENT_URL: payments.direct_payment_url,
  SHOW_CHECK_ADDRESS: payments.checks.show_postal_address,
  CHECK_TO: payments.checks.payee,
  CHECK_ADDRESS: payments.checks.address,
  PAYMENT_DUE_DATE: payments.payment_due_date,

  EVENT_TITLE: event.title,
  EVENT_TITLE_WITH_YEAR: event.title_with_year,
  REGISTRATION_TITLE: `${event.title} Registration`,
  CONFIRMATION_ELECTRONIC_TITLE: `${event.title} Confirmation`,
  CONFIRMATION_CHECK_TITLE: `${event.title} Registration`,

  EVENT_LOCATION: event.location,
  EVENT_DATE: event.date,
  EMAIL_CONTACT: contacts.info,
  TECH_CONTACT: contacts.tech,
  HOUSING_CONTACT: contacts.housing,
  MORE_INFO_URL: external_links.more_info,
  COVID_POLICY_URL: external_links.policies.covid,
  SAFETY_POLICY_URL: external_links.policies.safety,

  INCLUDE_PRONOUNS_ON_NAMETAG: nametags.include_pronouns,
  INCLUDE_LAST_ON_NAMETAG: nametags.include_last_name
};

export default baseConfig;