import { test, expect } from '@playwright/test';
import { fields } from './config';
import { validData } from './testData';

const getFieldSelector = (field: string, personIndex = 0) => 
  `input[name="people[${personIndex}].${field}"]`;

const getTextareaSelector = (field: string, personIndex = 0) => 
  `textarea[name="people[${personIndex}].${field}"]`;

const getOptionSelector = (field: string, value: string, personIndex = 0) =>
  `input[name="people[${personIndex}].${field}"][value="${value}"]`;


test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Registration/);
});

test.describe('form fields visibility', () => {
  test('all text input fields are visible', async ({ page }) => {
    await page.goto('/');
    for (const [field, config] of Object.entries(fields)) {
      if (!config.type || config.type === 'text') {
        const selector = getFieldSelector(field);
        await expect(page.locator(selector)).toBeVisible();
      }
    }
  });

  test('all textarea fields are visible', async ({ page }) => {
    await page.goto('/');
    for (const [field, config] of Object.entries(fields)) {
      if (config.type === 'textarea') {
        const selector = getTextareaSelector(field);
        await expect(page.locator(selector)).toBeVisible();
      }
    }
  });

  test('all checkbox and radio options are visible', async ({ page }) => {
    await page.goto('/');
    for (const [field, config] of Object.entries(fields)) {
      if ((config.type === 'checkbox' || config.type === 'radio') && config.options) {
        for (const option of config.options) {
          const selector = getOptionSelector(field, option);
          await expect(page.locator(selector)).toBeVisible();
        }
      }
    }
  });
});

test.describe('form submission', () => {
  test('submits successfully with required fields', async ({ page }) => {
    await page.goto('/');

    // Fill in required fields
    for (const [field, config] of Object.entries(fields)) {
      if (config.required) {
        const value = validData[field];
        if (value) {
          if (!config.type || config.type === 'text') {
            const selector = getFieldSelector(field);
            await page.fill(selector, value);
          } else if (config.type === 'checkbox' && config.options) {
            for (const option of config.options) {
              if (value.includes(option)) {
                const selector = getOptionSelector(field, option);
                await page.check(selector);
              }
            }
          }
        }
      }
    }

    // Submit the form
    await page.click('button:has-text("SAVE")');
    await expect(page.locator('text=Please review your information')).toBeVisible();
  });

});