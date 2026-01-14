import { getFieldConfig } from './config';
import type { Page } from '@playwright/test';
import type { PersonData } from './testData';

// form helpers

export const saveButtonSelector = 'button:has-text("SAVE")';
export const addAnotherPersonButtonSelector = 'button:has-text("ADD ANOTHER PERSON")';

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
  await page.click(saveButtonSelector);
};

export const addSecondPerson = async (page: Page, data: PersonData) =>
  await addPerson(page, data, 1);

export const addThirdPerson = async (page: Page, data: PersonData) =>
  await addPerson(page, data, 2);

export const addFourthPerson = async (page: Page, data: PersonData) =>
  await addPerson(page, data, 3);

export const navigateToPaymentPage = async (page: Page, people: PersonData[]) => {
  await page.goto('/');
  await addPerson(page, people[0]);
  for (let i = 1; i < people.length; i++) {
    await page.click(addAnotherPersonButtonSelector);
    await addPerson(page, people[i], i);
  }
  await page.click('button:has-text("NEXT")');
};
