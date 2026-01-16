import { expect } from '@playwright/test';
import { getFieldConfig, BUTTON_TEXT } from './config';
import type { Page } from '@playwright/test';
import type { PersonData } from './testData';

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

export const navigateToPaymentPage = async (page: Page, people: PersonData[]) => {
  await page.goto('/');
  await addPeople(page, people);
  await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
};

// helpers specifically for the payment form

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
