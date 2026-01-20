import { expect, type Page, type FrameLocator } from '@playwright/test';
import { type PersonData } from './testData';
import config, { getFieldConfig, BUTTON_TEXT, PAGE_URLS } from './config';
import { clearFirestore } from './helpers_firestore';

const { costDefault } = config.admissions;

// form helpers

export const getFieldSelector = (field: string, personIndex = 0) => 
  `input[name="people[${personIndex}].${field}"]`;

export const getTextareaSelector = (field: string, personIndex = 0) => 
  `textarea[name="people[${personIndex}].${field}"]`;

export const getOptionSelector = (field: string, value: string, personIndex = 0) =>
  `input[name="people[${personIndex}].${field}"][value="${value}"]`;

// Returns the locator for the error message associated with a field
export const getErrorLocator = (page: Page, field: string, personIndex = 0) => {
  const selector = getFieldSelector(field, personIndex);
  const input = page.locator(selector);
  const formControl = input.locator('xpath=ancestor::div[contains(@class, "MuiFormControl-root")]');
  return formControl.locator('.MuiFormHelperText-root.Mui-error'); 
}

export const expectFieldError = async (page: Page, field: string, personIndex = 0) =>
  await expect(getErrorLocator(page, field, personIndex)).toBeVisible();

export const expectNoFieldError = async (page: Page, field: string, personIndex = 0) =>
  await expect(getErrorLocator(page, field, personIndex)).not.toBeVisible();

export const fillField = async (page: Page, field: string, value: string | string[], personIndex = 0) => {
  const config = getFieldConfig(field);
  console.log(`Filling field ${field} (type: ${config.type}) with value:`, value);
  if (['text', 'email', 'pattern', 'address', 'autocomplete'].includes(config.type)) {
    await page.fill(getFieldSelector(field, personIndex), value as string);
  } else if (config.type === 'textarea') {
    await page.fill(getTextareaSelector(field, personIndex), value as string);
  } else if (config.type === 'checkbox') {
    const values = Array.isArray(value) ? value : [value];
    for (const val of values) {
      await page.check(getOptionSelector(field, val, personIndex));
    }
  }
};

export const fillFields = async (page: Page, data: PersonData, personIndex = 0) => {
  for (const field in data) {
    await fillField(page, field, data[field], personIndex);
  }
};

export const addPerson = async (page: Page, data: PersonData, personIndex = 0) => {
  await fillFields(page, data, personIndex);
  await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();
};

export const addPeople = async (page: Page, people: PersonData[]) => {
  for (let i = 0; i < people.length; i++) {
    if (i > 0) {
      await page.getByRole('button', { name: BUTTON_TEXT.ADD_ANOTHER_PERSON }).click();
    }
    await addPerson(page, people[i], i);
  }
}


// helpers specifically for the payment form

export const navigateToPaymentPage = async (page: Page, people: PersonData[]) => {
  await page.goto('/');
  await addPeople(page, people);
  await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
};

export const calculateFees = (amount: number) =>
  Number((0.0245 * amount + 0.5).toFixed(2));

export const expectPaymentSummary = async (page: Page, admissionsTotal: number, fees: number = 0, donation: number = 0) => {
  await expect(page.getByText(`Admissions Total: $${admissionsTotal}`)).toBeVisible();
  const total = admissionsTotal + fees + donation;
  
  if (fees) {
    await expect(page.getByText(`Covering Fees: $${fees.toFixed(2)}`)).toBeVisible();
  } else {
    await expect(page.getByText(`Covering Fees: $${fees.toFixed(2)}`)).not.toBeVisible();
  }

  if (donation) {
    await expect(page.getByText(`Donation: $${donation}`)).toBeVisible();
  } else {
    await expect(page.getByText(`Donation: $${donation}`)).not.toBeVisible();
  }

  await expect(page.getByText(`Total Amount Due: $${fees ? total.toFixed(2) : total}`)).toBeVisible();
};

export const expectDepositSummary = async (page: Page, depositTotal: number, fees?: number) => {
  await expect(page.getByText(`Deposit Total: $${depositTotal}`)).toBeVisible();
  
  if (fees) {
    await expect(page.getByText(`Covering Fees: $${fees.toFixed(2)}`)).toBeVisible();
    await expect(page.getByText(`Total Amount Due: $${(depositTotal + fees).toFixed(2)}`)).toBeVisible();
  } else {
    await expect(page.getByText('Covering Fees')).not.toBeVisible();
    await expect(page.getByText(`Total Amount Due: $${depositTotal}`)).toBeVisible();
  }
};

export const addDonation = async (page: Page, amount: number) => {
  const paymentInput = page.locator(getFieldSelector('admission'));
  const [_min, max] = config.admissions.costRange;

  // set admission to max amount
  await paymentInput.fill(max.toString());
  await paymentInput.blur();

  // add donation
  const donationButton = page.getByRole('button', { name: 'YES' });
  await donationButton.click();
  const donationField = page.locator('input[name="donation"]');
  await donationField.fill(amount.toString());
  await donationField.blur();
};


// helpers specifically for the checkout form

export const navigateToCheckoutPage = async (page: Page, people: PersonData[]) => {
  await navigateToPaymentPage(page, people);
  await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
};

export const openPaypalCheckoutForm = async (page: Page) => {
  const paypalFrameWrapper = page.locator('iframe[title="PayPal"]').first();
  await expect(paypalFrameWrapper).toBeVisible({ timeout: 15000 });
  const paypalFrame = paypalFrameWrapper.contentFrame();
  await paypalFrame.getByLabel('Debit or Credit Card').click();
  const paypalCreditFormWrapper = paypalFrame.locator('iframe[title="paypal_card_form"]').first();
  await expect(paypalCreditFormWrapper).toBeVisible({ timeout: 15000 });
  const paypalCreditForm = paypalCreditFormWrapper.contentFrame();
  await expect(paypalCreditForm.locator('input[id="email"]')).toBeVisible({ timeout: 15000 });
  return paypalCreditForm;
};

export const fillAndSubmitPaypalCreditForm = async (iframe: FrameLocator) => {
  await iframe.locator('input[id="email"]').fill('test-paypal@example.com');
  await iframe.locator('input[id="credit-card-number"]').fill('4012000077777777');
  await iframe.locator('input[id="expiry-date"]').fill('12/50');
  await iframe.locator('input[id="credit-card-security"]').fill('123');
  await iframe.locator('input[id="billingAddress.givenName"]').fill('Test');
  await iframe.locator('input[id="billingAddress.familyName"]').fill('User');
  await iframe.locator('input[id="billingAddress.postcode"]').fill('12345');
  await iframe.locator('input[id="phone"]').fill('5035551212');

  await iframe.getByRole('button', { name: `Pay $${costDefault}` }).click();
};

export const submitPaypalOrder = async (page: Page) => {
  clearFirestore();
  const paypalCreditForm = await openPaypalCheckoutForm(page);
  await fillAndSubmitPaypalCreditForm(paypalCreditForm);
  await expect(page).toHaveURL(PAGE_URLS.CONFIRMATION);
};
