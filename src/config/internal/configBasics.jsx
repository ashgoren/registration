import { fromZonedTime } from 'date-fns-tz';
import userConfig from '../configEvent.jsx';
const { prd, event, static_pages, registration, nametags, admissions, payments, contacts, external_links, calendar } = userConfig;

const costDefaultMapping = {
  'sliding-scale': admissions.sliding_scale.cost_default,
  'fixed': admissions.fixed.cost,
  'tiered': admissions.sliding_scale.cost_default // default for tiered is ignored; actual default is set in PersonForm#saveUpdatedOrder
};

const costRangeMapping = {
  'sliding-scale': admissions.sliding_scale.cost_range,
  'fixed': [admissions.fixed.cost, admissions.fixed.cost],
  'tiered': [0, 999]
}

const baseConfig = {
  PRD_LIVE: prd.live,

  STATIC_PAGES: static_pages.components,

  REGISTRATION_ONLY: static_pages.enabled === false,
  WAITLIST_MODE: registration.waitlist_mode,
  SHOW_PRE_REGISTRATION: registration.show_preregistration,

  PAYMENT_METHODS: payments.checks.allowed ? [payments.processor, 'check'] : [payments.processor],
  SHOW_PAYMENT_SUMMARY: payments.show_payment_summary,

  ADMISSION_QUANTITY_MAX: registration.admission_quantity_max,

  ADMISSIONS_MODE: admissions.mode,

  // Sliding scale settings
  ADMISSION_COST_RANGE: costRangeMapping[admissions.mode],
  ADMISSION_COST_DEFAULT: costDefaultMapping[admissions.mode],

  // Fixed cost settings
  ADMISSION_COST_FIXED: admissions.fixed.cost,

  // Tiered cost settings
  EARLYBIRD_CUTOFF: fromZonedTime(`${admissions.tiered.earlybird_cutoff}T23:59:59.999`, event.timezone),

  DEPOSIT_OPTION: payments.deposit.enabled,
  DEPOSIT_COST: payments.deposit.amount,
  DONATION_OPTION: payments.donation.enabled,
  DONATION_MAX: payments.donation.max,
  COVER_FEES_OPTION: payments.cover_fees_checkbox,
  DIRECT_PAYMENT_URL: payments.direct_payment_url,
  SHOW_CHECK_ADDRESS: payments.checks.show_postal_address,
  CHECK_TO: payments.checks.payee,
  CHECK_ADDRESS: payments.checks.address,
  PAYMENT_DUE_DATE: payments.payment_due_date,

  EVENT_TITLE: event.title,
  EVENT_TITLE_WITH_YEAR: event.title_with_year,
  NAVBAR_REGISTRATION_TITLE: `${event.title} Registration`,
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
  INCLUDE_LAST_ON_NAMETAG: nametags.include_last_name,

  CALENDAR: calendar
};

export default baseConfig;