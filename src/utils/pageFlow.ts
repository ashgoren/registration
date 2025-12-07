const PAGES = [
  { key: 'people', label: 'Info', skip: false, showInStepper: true, validate: true },
  { key: 'payment', label: 'Payment', skip: false, showInStepper: true, validate: true },
  { key: 'checkout', label: 'Checkout', skip: false, showInStepper: true, validate: false },
  { key: 'processing', label: 'Processing', skip: false, showInStepper: false, validate: false },
  { key: 'confirmation', label: 'Confirmation', skip: false, showInStepper: false, validate: false }
] as const;

const ACTIVE_PAGES = PAGES.filter(page => !page.skip);

export const STEPPER_PAGES = PAGES.filter(page => page.showInStepper);

export const VALIDATION_PAGES = ACTIVE_PAGES.filter(page => page.validate);

export const getNextPage = (currentPage: string) => {
  const currentIndex = ACTIVE_PAGES.findIndex(page => page.key === currentPage);
  // if (currentIndex === -1 || currentIndex === ACTIVE_PAGES.length - 1) throw new Error('No next page available');
  return ACTIVE_PAGES[currentIndex + 1].key;
};

export const getPreviousPage = (currentPage: string) => {
  const currentIndex = ACTIVE_PAGES.findIndex(page => page.key === currentPage);
  // if (currentIndex <= 0) throw new Error('No previous page available');
  return ACTIVE_PAGES[currentIndex - 1].key;
};
