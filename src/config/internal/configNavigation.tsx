import config from 'config/internal/configBasics';

const { WAITLIST_MODE, SHOW_WAIVER } = config;

const PAYMENT_PAGES = [
  { key: 'people', label: 'Info', skip: false, showInStepper: true, validate: true },
  { key: 'waiver', label: 'Waiver', skip: !SHOW_WAIVER, showInStepper: SHOW_WAIVER, validate: SHOW_WAIVER },
  { key: 'payment', label: 'Payment', skip: false, showInStepper: true, validate: true },
  { key: 'checkout', label: 'Checkout', skip: false, showInStepper: true, validate: false },
  { key: 'confirmation', label: 'Confirmation', skip: false, showInStepper: false, validate: false }
] as const;

const WAITLIST_PAGES = [
  { key: 'people', label: 'Info', skip: false, showInStepper: true, validate: true },
  { key: 'waiver', label: 'Waiver', skip: !SHOW_WAIVER, showInStepper: SHOW_WAIVER, validate: SHOW_WAIVER },
  { key: 'waitlist', label: 'Waitlist', skip: false, showInStepper: true, validate: true }
] as const;

const PAGES = (WAITLIST_MODE ? WAITLIST_PAGES : PAYMENT_PAGES).filter(page => !page.skip);
const STEPPER_PAGES = PAGES.filter(page => page.showInStepper);
const VALIDATION_PAGES = PAGES.filter(page => page.validate);

export default {
  PAGES,
  STEPPER_PAGES,
  VALIDATION_PAGES
}