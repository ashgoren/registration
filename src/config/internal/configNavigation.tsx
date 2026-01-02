import configEvent from 'config/configEvent';

const { registration } = configEvent;
const { showWaiver, waitlistMode } = registration;

const paymentPages = [
  { key: 'people', label: 'Info', skip: false, showInStepper: true, validate: true },
  { key: 'waiver', label: 'Waiver', skip: !showWaiver, showInStepper: showWaiver, validate: showWaiver },
  { key: 'payment', label: 'Payment', skip: false, showInStepper: true, validate: true },
  { key: 'checkout', label: 'Checkout', skip: false, showInStepper: true, validate: false },
  { key: 'confirmation', label: 'Confirmation', skip: false, showInStepper: false, validate: false }
] as const;

const waitlistPages = [
  { key: 'people', label: 'Info', skip: false, showInStepper: true, validate: true },
  { key: 'waiver', label: 'Waiver', skip: !showWaiver, showInStepper: showWaiver, validate: showWaiver },
  { key: 'waitlist', label: 'Waitlist', skip: false, showInStepper: true, validate: true }
] as const;

const pages = (waitlistMode ? waitlistPages : paymentPages).filter(page => !page.skip);
const stepperPages = pages.filter(page => page.showInStepper);
const validationPages = pages.filter(page => page.validate);

export default {
  pages,
  stepperPages,
  validationPages
};