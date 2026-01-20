import { test, expect, type FrameLocator } from '@playwright/test';
import { navigateToCheckoutPage, getFieldSelector, addDonation, calculateFees, submitPaypalOrder, fillAndSubmitPaypalCreditForm, openPaypalCheckoutForm } from './helpers';
import { getOrderByEmail } from './helpers_firestore';
import { interceptAction } from './helper_firebase_intercept';
import { person1 } from './testData';
import config, { BUTTON_TEXT, PAGE_URLS } from './config';

const { costDefault, costRange: [_min, max] } = config.admissions;

test.describe('Checkout Form', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCheckoutPage(page, [person1]);
  });

  test('shows correct URL', async ({ page }) => {
    await expect(page).toHaveURL(PAGE_URLS.CHECKOUT);
  });

  test('shows order summary', async ({ page }) => {
    await expect(page.getByText('Your Info')).toBeVisible();
    await expect(page.getByText('Name for roster: Person One')).toBeVisible();
    await expect(page.getByText(`Email: ${person1.email}`)).toBeVisible();
    await expect(page.getByText(`Phone: ${person1.phone}`)).toBeVisible();
  });

  test('shows payment info', async ({ page }) => {
    await expect(page.getByText('Payment Info')).toBeVisible();
    await expect(page.getByText(`Registration: $${costDefault}`)).toBeVisible();
  });

  test('allows going back to payment page', async ({ page }) => {
    await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
    await expect(page).toHaveURL(PAGE_URLS.PAYMENT);
  });

  test('shows amount to be charged', async ({ page }) => {
    await expect(page.getByText(`Amount to be charged: $${costDefault}`)).toBeVisible();
  });

  test('includes donation and fees if applicable', async ({ page }) => {
    await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();

    // with donation
    let donation = 0;
    if (config.payments.donation.enabled) {
      donation = 20;
      await addDonation(page, donation);
    }

    // with fees
    let fees = 0;
    if (config.payments.coverFeesCheckbox) {
      const feesCheckbox = page.locator('input[name="coverFees"]');
      await feesCheckbox.check();
      fees =  calculateFees(max + donation);
    }

    await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();

    await expect(page.getByText(`Additional donation: $${donation}`)).toBeVisible();
    await expect(page.getByText(`Transaction fees: $${fees.toFixed(2)}`)).toBeVisible();

    await expect(page.getByText(`Amount to be charged: $${(max + donation + fees).toFixed(2)}`)).toBeVisible();
  });

  test('includes deposit info if applicable', async ({ page }) => {
    test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');
    const depositAmount = config.payments.deposit.amount;
    const dueDate = config.payments.paymentDueDate;

    await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
    
    let fees = 0;
    if (config.payments.coverFeesCheckbox) {
      const feesCheckbox = page.locator('input[name="coverFees"]');
      await feesCheckbox.check();
      fees =  calculateFees(depositAmount);
    }

    await page.getByRole('tab', { name: 'DEPOSIT' }).click();
    await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();

    await expect(page.getByText(`Deposit due now: $${depositAmount}`)).toBeVisible();
    await expect(page.getByText(`The balance of your registration fee is due by ${dueDate}.`)).toBeVisible();
    if (fees) {
      await expect(page.getByText(`Transaction fees: $${fees.toFixed(2)}`)).toBeVisible();
      await expect(page.getByText(`Amount to be charged: $${(depositAmount + fees).toFixed(2)}`)).toBeVisible();
    } else {
      await expect(page.getByText(`Amount to be charged: $${depositAmount}`)).toBeVisible();
    }
  });

  test('shows updated amount when amount is changed on payment page', async ({ page }) => {
    await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
    const paymentInput = page.locator(getFieldSelector('admission'));
    const newAmount = costDefault + 10;
    await paymentInput.fill(newAmount.toString());
    await paymentInput.blur();
    await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
    await expect(page.getByText(`Amount to be charged: $${newAmount}`)).toBeVisible();
  });

  test.describe.serial('paypal', () => {
    test.setTimeout(60000);

    test('shows paypal checkout form', async ({ page }) => {
      const paypalFrameWrapper = page.locator('iframe[title="PayPal"]').first();
      await expect(paypalFrameWrapper).toBeVisible();
      const paypalFrame = paypalFrameWrapper.contentFrame();
      await expect(paypalFrame.getByLabel('Debit or Credit Card')).toBeVisible();
    });

    test.describe('inline debit/credit card form', () => {
      let paypalCreditForm: FrameLocator;

      test.beforeEach(async ({ page }) => {
        paypalCreditForm = await openPaypalCheckoutForm(page);
      });

      test('opens debit/credit card form', async () => {
        await expect(paypalCreditForm.locator('body')).toBeVisible();
        await expect(paypalCreditForm.getByRole('button', { name: `Pay $${costDefault}` })).toBeVisible({ timeout: 15000});
      });

      test('hides back button when in debit/credit card form', async ({ page }) => {
        await expect(page.getByRole('button', { name: BUTTON_TEXT.BACK })).not.toBeVisible();
      });

      test('shows back button again if form closed', async ({ page }) => {
        await paypalCreditForm.getByRole('button', { name: 'Cancel and go back' }).click();
        await expect(page.getByRole('button', { name: BUTTON_TEXT.BACK })).toBeVisible();
      });

      test('shows validation errors for empty required fields', async () => {
        await paypalCreditForm.getByRole('button', { name: `Pay $${costDefault}` }).click();
        await expect(paypalCreditForm.locator('input[id="email"]')).toHaveAttribute('aria-invalid', 'true');
      });

      test('submits debit/credit card form with valid data', async ({ page }) => {
        await fillAndSubmitPaypalCreditForm(paypalCreditForm);
        await expect(page).toHaveURL(PAGE_URLS.CONFIRMATION);
      });

      test('submitting works after navigating back and forth', async ({ page }) => {
        await paypalCreditForm.getByRole('button', { name: 'Cancel and go back' }).click();
        await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
        await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();

        const reopenedPaypalCreditForm = await openPaypalCheckoutForm(page);

        await fillAndSubmitPaypalCreditForm(reopenedPaypalCreditForm);

        await expect(page).toHaveURL(PAGE_URLS.CONFIRMATION);
      });
    });

    test('saves order to Firestore', async ({ page }) => {
      await submitPaypalOrder(page);

      const order = await getOrderByEmail(person1.email as string);
      expect(order).toBeDefined();
      expect(order.status).toBe('final');
      expect(order.charged).toBe(costDefault);
      expect(order.people.length).toBe(1);
      expect(order.people[0].first).toBe(person1.first);
      expect(order.people[0].last).toBe(person1.last);
    });

    test.describe('error handling', () => {
      test('does not capture payment if pending order save fails', async ({ page }) => {
        const calledActions = await interceptAction(page, 'savePendingOrder', {
          code: 'internal',
          message: 'Database error'
        });

        const paypalCreditForm = await openPaypalCheckoutForm(page);
        await fillAndSubmitPaypalCreditForm(paypalCreditForm);

        await expect(page.getByText(/issue saving your order/i)).toBeVisible();
        await expect(page.getByText(/You were not charged/i)).toBeVisible();

        expect(calledActions).toContain('savePendingOrder');
        expect(calledActions).not.toContain('capturePaypalOrder');
      });

      test('shows error when payment capture fails', async ({ page }) => {
        await interceptAction(page, 'capturePaypalOrder', {
          message: 'Payment declined',
          code: 'card_declined'
        });

        const paypalCreditForm = await openPaypalCheckoutForm(page);
        await fillAndSubmitPaypalCreditForm(paypalCreditForm);

        await expect(page.getByText(/issue processing your payment/i)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
      });

      test('shows partial success error when final order save fails', async ({ page }) => {
        await interceptAction(page, 'saveFinalOrder', {
          message: 'Database error',
          code: 'internal'
        });

        const paypalCreditForm = await openPaypalCheckoutForm(page);
        await fillAndSubmitPaypalCreditForm(paypalCreditForm);

        // This is the critical case - payment succeeded but save failed
        await expect(page.getByText(/payment was processed successfully/i)).toBeVisible();
        await expect(page.getByText(/error updating your registration/i)).toBeVisible();
      });
    });
  });
});
