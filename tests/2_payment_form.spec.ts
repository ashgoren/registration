import { test, expect } from '@playwright/test';
import config, { BUTTON_TEXT, PAGE_URLS } from './config';
import { person1, person2 } from './testData';
import { navigateToPaymentPage, getFieldSelector, addPerson, calculateFees, expectPaymentSummary, expectDepositSummary, addDonation } from './helpers';

const { costDefault, costRange: [min, max] } = config.admissions;
const depositAmount = config.payments.deposit.amount;
const dueDate = config.payments.paymentDueDate;

test.describe('sliding scale payment form', () => {
  test.skip(config.admissions.mode !== 'sliding-scale', 'Skipping sliding scale payment form tests');

  test.beforeEach(async ({ page }) => {
    await navigateToPaymentPage(page, [person1]);
  });

  test('shows full payment and deposit options', async ({ page }) => {
    test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');

    await expect(page).toHaveURL(PAGE_URLS.PAYMENT);

    // Check that full payment and deposit options are visible
    await expect(page.getByRole('tab', { name: 'FULL PAYMENT' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'DEPOSIT' })).toBeVisible();
  });

  test.describe('full payment tab', () => {
    test('shows sliding scale question and default rate', async ({ page }) => {
      const paymentInput = page.locator(getFieldSelector('admission'));

      // shows sliding scale and default rate on load
      await expect(page.getByText('How much are you able to pay?')).toBeVisible();
      await expect(paymentInput).toHaveValue(costDefault.toString());

      if (config.payments.deposit?.enabled) {
        await page.getByRole('tab', { name: 'DEPOSIT' }).click();
        await page.getByRole('tab', { name: 'FULL PAYMENT' }).click();

        // shows sliding scale when returning to full payment tab
        await expect(page.getByText('How much are you able to pay?')).toBeVisible();
        await expect(paymentInput).toHaveValue(costDefault.toString());
      }
    });

    test('allows changing payment amount within allowed range', async ({ page }) => {
      const paymentInput = page.locator(getFieldSelector('admission'));

      const newAmount = min + 10;
      await paymentInput.fill(newAmount.toString());
      await expect(paymentInput).toHaveValue(newAmount.toString());
    });

    test.describe('validates payment amount input', () => {
      const validationCases = [
        { input: min - 1, expected: min, description: 'enforces min limit' },
        { input: max + 1, expected: max, description: 'enforces max limit' },
        { input: '', expected: min, description: 'handles empty input' },
      ];

      for (const { input, expected, description } of validationCases) {
        test(description, async ({ page }) => {
          const paymentInput = page.locator(getFieldSelector('admission'));
          await paymentInput.fill(input.toString());
          await expect(paymentInput).toHaveValue(input.toString());
          await paymentInput.blur();
          await expect(paymentInput).toHaveValue(expected.toString());
        });
      }
    });

    test('persists custom payment amount when switching tabs', async ({ page }) => {
      test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');

      const paymentInput = page.locator(getFieldSelector('admission'));
      const customAmount = min + 20;

      await paymentInput.fill(customAmount.toString());
      await expect(paymentInput).toHaveValue(customAmount.toString());

      await page.getByRole('tab', { name: 'DEPOSIT' }).click();
      await page.getByRole('tab', { name: 'FULL PAYMENT' }).click();

      // retains custom amount when returning to full payment tab
      await expect(paymentInput).toHaveValue(customAmount.toString());
    });

    test('shows donation option if admission amount is max', async ({ page }) => {
      test.skip(!config.payments.donation?.enabled, 'Donation option not enabled in config');

      const paymentInput = page.locator(getFieldSelector('admission'));
      
      // is hidden initially
      await expect(page.getByText('Would you like to make an additional contribution?')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'YES' })).not.toBeVisible();

      // set to max amount
      await paymentInput.fill(max.toString());
      await paymentInput.blur();

      // donation option is visible
      await expect(page.getByText('Would you like to make an additional contribution?')).toBeVisible();
      await expect(page.getByRole('button', { name: 'YES' })).toBeVisible();
    });
    
    test.describe('with donation', () => {
      test.skip(!config.payments.donation?.enabled, 'Donation option not enabled in config');

      const donationAmount = 50;

      test.beforeEach(async ({ page }) => {
        await addDonation(page, donationAmount);
      });

      test('adds donation to total', async ({ page }) => {
        await expectPaymentSummary(page, max, 0, donationAmount);
      });

      test('fees calculation includes donation', async ({ page }) => {
        test.skip(!config.payments.coverFeesCheckbox, 'Cover fees checkbox not enabled in config');

        const feesCheckbox = page.locator('input[name="coverFees"]');
        await feesCheckbox.check();
        const totalAmount = max + donationAmount;
        await expectPaymentSummary(page, max, calculateFees(totalAmount), donationAmount);
      });

      test('does not include donation if deposit', async ({ page }) => {
        test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');

        await page.getByRole('tab', { name: 'DEPOSIT' }).click();
        await expect(page.getByText('Donation:')).not.toBeVisible();
        await expect(page.getByText(`Total Amount Due: $${depositAmount}`)).toBeVisible();
      });

      test('shows donation even if admission less than max, if already entered', async ({ page }) => {
        const paymentInput = page.locator(getFieldSelector('admission'));

        // set admission below max
        const belowMax = max - 30;
        await paymentInput.fill(belowMax.toString());
        await paymentInput.blur();

        // donation amount is still shown
        await expect(page.getByText(`Donation: $${donationAmount}`)).toBeVisible();
      });
    });
  });

  test.describe('deposit tab', () => {
    test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');

    test('shows deposit amount and due date', async ({ page }) => {
      await page.getByRole('tab', { name: 'DEPOSIT' }).click();

      await expect(page.getByText(`A deposit of $${depositAmount} per person is required to reserve your spot.`)).toBeVisible();
      await expect(page.getByText(`The balance of the payment will be due by ${dueDate}`)).toBeVisible();
    });
  });

  test.describe('fees checkbox', () => {
    test.skip(!config.payments.coverFeesCheckbox, 'Cover fees checkbox not enabled in config');

    test('is unchecked by default and can be checked', async ({ page }) => {
      const feesCheckbox = page.locator('input[name="coverFees"]');

      // unchecked by default
      await expect(feesCheckbox).not.toBeChecked();

      // can be checked
      await feesCheckbox.check();
      await expect(feesCheckbox).toBeChecked();
    });

    test('updates fees amount', async ({ page }) => {
      const paymentInput = page.locator(getFieldSelector('admission'));

      // Check that the fees amount is displayed correctly
      await expect(page.getByText(`I would like to add $${calculateFees(costDefault)} to cover the transaction fees.`)).toBeVisible();

      // Check that changing the admission amount updates the fees amount
      const newAdmission = costDefault + 30;
      await paymentInput.fill(newAdmission.toString());
      await paymentInput.blur(); // trigger recalculation

      await expect(page.getByText(`I would like to add $${calculateFees(newAdmission)} to cover the transaction fees.`)).toBeVisible();
    });

    test('retains checked state when switching tabs', async ({ page }) => {
      test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');

      const feesCheckbox = page.locator('input[name="coverFees"]');

      await feesCheckbox.check();
      await expect(feesCheckbox).toBeChecked();

      await page.getByRole('tab', { name: 'DEPOSIT' }).click();
      await page.getByRole('tab', { name: 'FULL PAYMENT' }).click();

      // retains checked state when returning to full payment tab
      await expect(feesCheckbox).toBeChecked();
    });

    test('calculates fees correctly for deposit', async ({ page }) => {
      test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');

      const feesCheckbox = page.locator('input[name="coverFees"]');

      await page.getByRole('tab', { name: 'DEPOSIT' }).click();

      // Check that the fees amount is displayed correctly for deposit
      await expect(page.getByText(`I would like to add $${calculateFees(depositAmount)} to cover the transaction fees.`)).toBeVisible();

      // Check that checking the fees checkbox retains correct amount
      await feesCheckbox.check();
      await expect(feesCheckbox).toBeChecked();
      await expect(page.getByText(`I would like to add $${calculateFees(depositAmount)} to cover the transaction fees.`)).toBeVisible();
    });

    test('calculates fees correctly even on invalid input', async ({ page }) => {
      const paymentInput = page.locator(getFieldSelector('admission'));

      // enter invalid input
      await paymentInput.fill('');
      await expect(paymentInput).toHaveValue('');
      await paymentInput.blur(); // trigger validation

      // Check that the fees amount is calculated based on min value
      await expect(page.getByText(`I would like to add $${calculateFees(min)} to cover the transaction fees.`)).toBeVisible();
    });

    test('calculates fees correctly even if amount over max entered', async ({ page }) => {
      const paymentInput = page.locator(getFieldSelector('admission'));

      // enter amount over max
      const overMax = max + 50;
      await paymentInput.fill(overMax.toString());
      await expect(paymentInput).toHaveValue(overMax.toString());
      await paymentInput.blur(); // trigger validation

      // Check that the fees amount is calculated based on max value
      await expect(page.getByText(`I would like to add $${calculateFees(max)} to cover the transaction fees.`)).toBeVisible();
    });
  });

  test.describe('payment summary', () => {
    test('sliding scale', async ({ page }) => {
      // initial amounts
      await expectPaymentSummary(page, costDefault);

      // after changing admission amount
      const paymentInput = page.locator(getFieldSelector('admission'));
      const newAdmission = costDefault + 20;
      await paymentInput.fill(newAdmission.toString());
      await paymentInput.blur(); // trigger recalculation
      await expectPaymentSummary(page, newAdmission);

      // check cover fees checkbox
      if (config.payments.coverFeesCheckbox) {
        const feesCheckbox = page.locator('input[name="coverFees"]');
        await feesCheckbox.check();
        await expectPaymentSummary(page, newAdmission, calculateFees(newAdmission));
      }
    });

    test('deposit', async ({ page }) => {
      test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');

      await page.getByRole('tab', { name: 'DEPOSIT' }).click();

      // initial amounts
      await expectDepositSummary(page, depositAmount);

      // check the cover fees checkbox
      if (config.payments.coverFeesCheckbox) {
        const feesCheckbox = page.locator('input[name="coverFees"]');
        await feesCheckbox.check();
        await expectDepositSummary(page, depositAmount, calculateFees(depositAmount));
      }
    });
  });

  test.describe('navigation', () => {
    test('back button navigates to previous page', async ({ page }) => {
      const backButton = page.getByRole('button', { name: BUTTON_TEXT.BACK });
      await backButton.click();
      await expect(page).toHaveURL(PAGE_URLS.REGISTRATION);
    });

    test('next button proceeds to confirmation page', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: BUTTON_TEXT.NEXT });
      await nextButton.click();
      await expect(page).toHaveURL(PAGE_URLS.CHECKOUT);
    });

    test('retains state when returning to payment page', async ({ page }) => {
      const paymentInput = page.locator(getFieldSelector('admission'));

      if (config.payments.donation?.enabled) {
        await addDonation(page, 75);
      }

      if (config.payments.coverFeesCheckbox) {
        const feesCheckbox = page.locator('input[name="coverFees"]');
        await feesCheckbox.check();
      }

      // navigate back to previous page
      await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
      await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
      await expect(paymentInput).toHaveValue(max.toString());
      if (config.payments.coverFeesCheckbox) {
        await expect(page.getByText('I would like to add')).toBeVisible();
      }
      if (config.payments.donation?.enabled) {
        await expect(page.getByText('Donation: $75')).toBeVisible();
      }
      
      // navigate forward to confirmation page and back again
      await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
      await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
      await expect(paymentInput).toHaveValue(max.toString());
      if (config.payments.coverFeesCheckbox) {
        await expect(page.getByText('I would like to add')).toBeVisible();
      }
      if (config.payments.donation?.enabled) {
        await expect(page.getByText('Donation: $75')).toBeVisible();
      }

      // switch to deposit tab and navigate away and back
      if (config.payments.deposit?.enabled) {
        await page.getByRole('tab', { name: 'DEPOSIT' }).click();
        await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
        await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
        await expect(page.getByText(`Deposit Total: $${depositAmount}`)).toBeVisible();
      }
    });
  });

  test.describe('with multiple people', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
      await page.getByRole('button', { name: BUTTON_TEXT.ADD_ANOTHER_PERSON }).click();
      await addPerson(page, person2, 1);
      await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
    });

    test('shows inputs for each person', async ({ page }) => {
      await expect(page.getByText('How much is each person able to pay?')).toBeVisible();
      await expect(page.getByText('Person One')).toBeVisible();
      await expect(page.getByText('Person Two')).toBeVisible();
      await expect(page.locator(getFieldSelector('admission', 0))).toBeVisible();
      await expect(page.locator(getFieldSelector('admission', 1))).toBeVisible();
    });

    test('validates payment amounts for multiple people', async ({ page }) => {
      const paymentInput1 = page.locator(getFieldSelector('admission', 0));
      const paymentInput2 = page.locator(getFieldSelector('admission', 1));

      // Set invalid amount for person 1
      const belowMin = min - 5;
      await paymentInput1.fill(belowMin.toString());
      await paymentInput1.blur();
      await expect(paymentInput1).toHaveValue(min.toString());

      // Set invalid amount for person 2
      const overMax = max + 10;
      await paymentInput2.fill(overMax.toString());
      await paymentInput2.blur();
      await expect(paymentInput2).toHaveValue(max.toString());
    });

    test('calculates totals for multiple people with and without fees', async ({ page }) => {
      const paymentInput1 = page.locator(getFieldSelector('admission', 0));
      const paymentInput2 = page.locator(getFieldSelector('admission', 1));

      // Change amounts for both people
      const amount1 = min + 10;
      const amount2 = min + 20;
      await paymentInput1.fill(amount1.toString());
      await paymentInput1.blur();
      await paymentInput2.fill(amount2.toString());
      await paymentInput2.blur();

      const totalAdmissions = amount1 + amount2;

      // without fees
      await expectPaymentSummary(page, totalAdmissions);

      // with fees
      if (config.payments.coverFeesCheckbox) {
        const feesCheckbox = page.locator('input[name="coverFees"]');
        await feesCheckbox.check();
        await expectPaymentSummary(page, totalAdmissions, calculateFees(totalAdmissions));
      }
    });

    test('calculates deposit totals for multiple people', async ({ page }) => {
      test.skip(!config.payments.deposit?.enabled, 'Deposit option not enabled in config');

      await page.getByRole('tab', { name: 'DEPOSIT' }).click();
      const totalDeposit = depositAmount * 2;

      // initial amounts
      await expect(page.getByText(`Deposit Total: $${totalDeposit}`)).toBeVisible();
      await expect(page.getByText(`Total Amount Due: $${totalDeposit}`)).toBeVisible();

      // after checking fees checkbox
      if (config.payments.coverFeesCheckbox) {
        const feesCheckbox = page.locator('input[name="coverFees"]');
        await feesCheckbox.check();
        await expectDepositSummary(page, totalDeposit, calculateFees(totalDeposit));
      }
    });

    test('shows donation option only if first person pays max', async ({ page }) => {
      test.skip(!config.payments.donation?.enabled, 'Donation option not enabled in config');

      const paymentInput1 = page.locator(getFieldSelector('admission', 0));

      // set first person to max amount
      await paymentInput1.fill(max.toString());
      await paymentInput1.blur();

      // donation option is visible
      await expect(page.getByText('Would you like to make an additional contribution?')).toBeVisible();
      await expect(page.getByRole('button', { name: 'YES' })).toBeVisible();

      // set first person below max amount
      const belowMax = max - 20;
      await paymentInput1.fill(belowMax.toString());
      await paymentInput1.blur();

      // donation option is not visible
      await expect(page.getByText('Would you like to make an additional contribution?')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'YES' })).not.toBeVisible();
    });
  });
});