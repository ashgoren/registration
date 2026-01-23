import { test, expect } from '@playwright/test';
import { navigateToConfirmationPage } from './helpers';
import { person1, person2 } from './testData';
import config from './config';

const { costDefault } = config.admissions;

test.describe('Confirmation Form', () => {
  test('shows confirmation page with order summary', async ({ page }) => {
    await navigateToConfirmationPage(page, [person1]);
    await expect(page.getByText(`Thanks ${person1.first}!`)).toBeVisible();
    await expect(page.getByText('Your payment has been processed.')).toBeVisible();
    await expect(page.getByText(`Amount paid: $${costDefault}`)).toBeVisible();

    await expect(page.getByText('Your info')).toBeVisible();
    await expect(page.getByText(`Email: ${person1.email}`)).toBeVisible();
    await expect(page.getByText(`Phone: ${person1.phone}`)).toBeVisible();

    await expect(page.getByText('Payment info')).toBeVisible();
    await expect(page.getByText(`Registration: $${costDefault}`)).toBeVisible();
  });

  test('shows multiple people in order summary', async ({ page }) => {
    await navigateToConfirmationPage(page, [person1, person2]);
    await expect(page.getByText(`Thanks ${person1.first}!`)).toBeVisible();
    await expect(page.getByText('Your payment has been processed.')).toBeVisible();
    await expect(page.getByText(`Amount paid: $${costDefault * 2}`)).toBeVisible();

    await expect(page.getByText(`Email: ${person1.email}`)).toBeVisible();
    await expect(page.getByText(`Email: ${person2.email}`)).toBeVisible();
  });
});