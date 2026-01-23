import { test, expect } from '@playwright/test';
import config, { fields, fieldsConfig, isTextField, isTextAreaField, isCheckboxOrRadioField, getOptions, BUTTON_TEXT, PAGE_TEXT } from './config';
import { person1, person2, personWithAllFields } from './testData';
import {
  getFieldSelector, getTextareaSelector, getOptionSelector,
  fillField, fillFields,
  addPerson, addPeople,
  expectFieldError, expectNoFieldError,
} from './helpers';

test.describe('form page 1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('form loads with basic structure', async ({ page }) => {
    await expect(page).toHaveTitle(/Registration/);
    await expect(page.locator(getFieldSelector('first'))).toBeVisible();
    await expect(page.locator(getFieldSelector('email'))).toBeVisible();
    await expect(page.getByRole('button', { name: BUTTON_TEXT.SAVE })).toBeVisible();
  });

  test.describe('form fields visibility', () => {
    test('all text input fields are visible', async ({ page }) => {
      for (const field in personWithAllFields) {
        if (isTextField(field)) {
          const selector = getFieldSelector(field);
          await expect(page.locator(selector)).toBeVisible();
        }
      }
    });

    test('all textarea fields are visible', async ({ page }) => {
      for (const field in personWithAllFields) {
        if (isTextAreaField(field)) {
          const selector = getTextareaSelector(field);
          await expect(page.locator(selector)).toBeVisible();
        }
      }
    });

    test('all checkbox and radio options are visible', async ({ page }) => {
      for (const field in personWithAllFields) {
        if (isCheckboxOrRadioField(field)) {
          for (const option of getOptions(field)) {
            const selector = getOptionSelector(field, option.value);
            await expect(page.locator(selector)).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('form validation', () => {
    test('submits successfully with required fields', async ({ page }) => {
      await addPerson(page, person1);
      await expect(page.getByText(PAGE_TEXT.REVIEW_INFO)).toBeVisible();
    });

    test('shows error on required text fields when they lose focus', async ({ page }) => {
      for (const field in person1) {
        if (isTextField(field)) {
          const input = page.locator(getFieldSelector(field));
          
          // Focus the field, then blur without entering anything
          await input.focus();
          await input.blur();
          
          // Check for error message
          await expectFieldError(page, field);
        }
      }
    });

    test('hides error on required text fields after valid input', async ({ page }) => {
      for (const field in person1) {
        if (isTextField(field)) {
          const input = page.locator(getFieldSelector(field));

          // Trigger error first
          await input.focus();
          await input.blur();

          // Now fill with valid data
          if (person1[field]) {
            await input.fill(person1[field] as string);
            await input.blur();
            await expectNoFieldError(page, field);
          }
        }
      }
    });

    test('on save shows errors on all missing required fields', async ({ page }) => {
      await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click(); // submit empty form to trigger errors

      // Check that all required fields show errors, including agreement
      for (const field in person1) {
        if (isTextField(field)) {
          await expectFieldError(page, field);
        }
        if (field === 'agreement') {
          await expect(page.getByText('You must agree to')).toBeVisible();
        }
      }
    });

    test('scrolls to first invalid field on save', async ({ page }) => {
      // Scroll to bottom so first name is out of view
      await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).scrollIntoViewIfNeeded();

      const firstNameField = page.locator(getFieldSelector('first'));
      await expect(firstNameField).not.toBeInViewport();

      // Click save - should scroll to first invalid field (first name)
      await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();

      await expect(firstNameField).toBeInViewport();
    });

    test('fixing errors allows successful submission', async ({ page }) => {
      await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click(); // submit empty form to trigger error

      // Now fill in all required fields
      for (const field in person1) {
        await fillField(page, field, person1[field]);
      }
      
      await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();
      await expect(page.getByText(PAGE_TEXT.REVIEW_INFO)).toBeVisible();
    });

    test('does not submit when any required field is missing', async ({ page }) => {
      test.setTimeout(60_000);
      for (const fieldToSkip in person1) {
        await test.step(`Testing submission with missing required field: ${fieldToSkip}`, async () => {
          // Fill all required fields except the one to skip
          for (const field in person1) {
            if (person1[field] && field !== fieldToSkip) {
              await fillField(page, field, person1[field]);
            }
          }
          await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();

          await expect(page.getByText(PAGE_TEXT.REVIEW_INFO)).not.toBeVisible();
          await expectFieldError(page, fieldToSkip);

          await page.reload();
        });
      }
    });

    test('rejects invalid phone format', async ({ page }) => {
      await fillField(page, 'phone', '12345'); // Invalid format
      await page.locator(getFieldSelector('phone')).blur();
      await expectFieldError(page, 'phone');
    });

    test('rejects invalid email format', async ({ page }) => {
      await fillField(page, 'email', 'not-an-email');
      await page.locator(getFieldSelector('email')).blur();
      await expectFieldError(page, 'email');
    });

    test('rejects if email confirmation does not match email', async ({ page }) => {
      await fillField(page, 'email', person1['email']);
      await fillField(page, 'emailConfirmation', 'different-email@example.com');
      await page.locator(getFieldSelector('emailConfirmation')).blur();
      await expectFieldError(page, 'emailConfirmation');
    });
  });

  test.describe('dynamic field behavior', () => {    
    test('address autocomplete suggestions appear and can be selected', async ({ page }) => {
      test.skip(!person1.address, 'No address field in test data');

      const addressInput = page.locator(getFieldSelector('address'));
      const cityInput = page.locator(getFieldSelector('city'));
      const stateInput = page.locator(getFieldSelector('state'));
      const zipInput = page.locator(getFieldSelector('zip'));

      // type key-by-key to simulate user input
      await addressInput.click();
      await addressInput.pressSequentially('400 SW 6th Ave, Portland', { delay: 100 });

      const suggestion = page.getByText('400 SW 6th Ave, Portland, OR, USA');

      // MUI Autocomplete creates a Popper with options
      const autocompletePopper = page.locator('.MuiPopper-root');
      await expect(autocompletePopper).toBeVisible();
      await expect(suggestion).toBeVisible();
      await suggestion.click();

      await expect(addressInput).toHaveValue('400 SW 6th Ave');
      await expect(cityInput).toHaveValue('Portland');
      await expect(stateInput).toHaveValue('OR');
      await expect(zipInput).toHaveValue('97204');
    });

    test('state dropdown selections appear and can be selected', async ({ page }) => {
      test.skip(!person1.state, 'No state field in test data');

      const stateInput = page.locator(getFieldSelector('state'));
      await stateInput.click();
      const option = page.getByRole('option', { name: 'Oregon' });
      await expect(option).toBeVisible();
      await option.click();
      await expect(stateInput).toHaveValue('OR');
    });

    test('nametag field is auto-filled correctly, and can be overridden', async ({ page }) => {
      test.skip(!fields.includes('nametag'), 'No nametag field in test data');

      const { first, last } = person1;
      const { includeLastName } = config.nametags;

      const firstNameInput = page.locator(getFieldSelector('first'));
      const lastNameInput = page.locator(getFieldSelector('last'));
      const nametagInput = page.locator(getFieldSelector('nametag'));

      const expectedNametag = includeLastName ? `${first} ${last}` as string: first as string;

      // fill first name and check nametag
      await fillField(page, 'first', first);
      await firstNameInput.blur(); // trigger auto-fill
      await expect(nametagInput).toHaveValue(includeLastName ? '' : expectedNametag);

      // fill last name and check nametag
      await fillField(page, 'last', last);
      await lastNameInput.blur(); // trigger auto-fill
      await expect(nametagInput).toHaveValue(expectedNametag);

      // Now override nametag, simulating user input
      const customNametag = 'Custom Nametag';
      await nametagInput.click();
      await nametagInput.fill('');
      await nametagInput.pressSequentially(customNametag);
      await nametagInput.blur();
      await expect(nametagInput).toHaveValue(customNametag);
    });

    test('nametag field is not auto-filled if user has already entered a custom value', async ({ page }) => {
      test.skip(!fields.includes('nametag'), 'No nametag field in test data');

      const { first, last } = person1;

      const nametagInput = page.locator(getFieldSelector('nametag'));

      // // User enters a custom nametag first
      await fillField(page, 'nametag', 'Custom Nametag');

      // Now fill first and last name
      await fillField(page, 'first', first);
      await fillField(page, 'last', last);

      // Nametag should remain as the custom value
      await expect(nametagInput).toHaveValue('Custom Nametag');
    });

    test('minor option in misc shows additional comments field when selected', async ({ page }) => {
      test.skip(!fields.includes('misc'), 'No misc field in config');
      test.skip(!fields.includes('miscComments'), 'No miscComments field in config');
      test.skip(!fieldsConfig.misc.options.map(o => o.value).includes('minor'), 'No minor option in misc field');

      const minorOption = page.locator(getOptionSelector('misc', 'minor'));
      const miscComments = page.locator(getTextareaSelector('miscComments'));

      // Initially comments should be hidden
      await expect(miscComments).not.toBeVisible();

      // Select minor option
      await minorOption.check();
      await expect(miscComments).toBeVisible();

      // Deselect minor option
      await minorOption.uncheck();
      await expect(miscComments).not.toBeVisible();
    });

    test('checking any share option auto-checks name', async ({ page }) => {
      test.skip(!fields.includes('share'), 'No share field in config');

      const nameOption = page.locator(getOptionSelector('share', 'name'));
      const emailOption = page.locator(getOptionSelector('share', 'email'));

      await nameOption.uncheck(); // uncheck everything first
      await expect(nameOption).not.toBeChecked();

      await emailOption.check();
      await expect(nameOption).toBeChecked(); // Should auto-check
    });

    test('copies address from first person to second person', async ({ page }) => {
      test.skip(!fields.includes('address'), 'No address field in config'); 

      await addPerson(page, person1);
      await page.getByRole('button', { name: BUTTON_TEXT.ADD_ANOTHER_PERSON }).click();

      // Check the "Copy address from Person One" checkbox
      await page.getByRole('checkbox', { name: /Copy address from .*/ }).click();

      // Verify fields are populated
      await expect(page.locator(getFieldSelector('address', 1))).toHaveValue(person1.address as string);
      await expect(page.locator(getFieldSelector('city', 1))).toHaveValue(person1.city as string);
      await expect(page.locator(getFieldSelector('state', 1))).toHaveValue(person1.state as string);
      await expect(page.locator(getFieldSelector('zip', 1))).toHaveValue(person1.zip as string);
    });

    test('unchecking copy address re-enables address fields without clearing values', async ({ page }) => {
      test.skip(!fields.includes('address'), 'No address field in config'); 

      await addPerson(page, person1);
      await page.getByRole('button', { name: BUTTON_TEXT.ADD_ANOTHER_PERSON }).click();

      // Check the "Copy address from Person One" checkbox
      const copyCheckbox = page.getByRole('checkbox', { name: /Copy address from .*/ });
      await copyCheckbox.click();

      const addressField = page.locator(getFieldSelector('address', 1));
      const cityField = page.locator(getFieldSelector('city', 1));
      const stateField = page.locator(getFieldSelector('state', 1));
      const zipField = page.locator(getFieldSelector('zip', 1));

      // Expect address fields to be disabled
      await expect(addressField).toBeDisabled();
      await expect(cityField).toBeDisabled();
      await expect(stateField).toBeDisabled();
      await expect(zipField).toBeDisabled();

      // Uncheck the copy checkbox
      await copyCheckbox.click();

      // Verify fields are still enabled and populated
      await expect(addressField).toBeEnabled();
      await expect(cityField).toBeEnabled();
      await expect(stateField).toBeEnabled();
      await expect(zipField).toBeEnabled();

      await expect(addressField).toHaveValue(person1.address as string);
      await expect(cityField).toHaveValue(person1.city as string);
      await expect(stateField).toHaveValue(person1.state as string);
      await expect(zipField).toHaveValue(person1.zip as string);
    });
  });

  test.describe('adding multiple people', () => {
    test('form allows adding multiple people', async ({ page }) => {
      await addPeople(page, [person1, person2]);
      await expect(page.getByRole('button', { name: 'Person One' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Person Two' })).toBeVisible();
    });

    test('agreement checkbox is only shown for first person', async ({ page }) => {
      test.skip(!fields.includes('agreement'), 'No agreement field in config');

      await addPerson(page, person1);
      await page.getByRole('button', { name: BUTTON_TEXT.ADD_ANOTHER_PERSON }).click();

      // Agreement should not be visible for second person
      await expect(page.locator(getOptionSelector('agreement', 'yes', 1))).not.toBeVisible();
    });

    test('does not allow adding more than max # of people', async ({ page }) => {
      const maxPeople = config.registration.admissionQuantityMax;
      const people = [person1, ...Array(maxPeople - 1).fill(person2)];
      await addPeople(page, people);
      await expect(page.getByRole('button', { name: BUTTON_TEXT.ADD_ANOTHER_PERSON })).not.toBeVisible();
    });
  });

  // These tests are brittle, hardcoded to specific config
  test.describe('people summary', () => {
    test('shows correct summary after adding only required fields', async ({ page }) => {
      await addPerson(page, person1);
      await page.getByRole('button', { name: 'Person One' }).click();

      await expect(page.getByText('Name for Roster: Person One')).toBeVisible();
      await expect(page.getByText('Email: ' + person1.email)).toBeVisible();
      await expect(page.getByText('Phone: ' + person1.phone)).toBeVisible();
      if (fields.includes('address')) {
        await expect(page.getByText('Address: ' + person1.address + ', ' + person1.city + ', ' + person1.state + ' ' + person1.zip)).toBeVisible();
      }
      if (fields.includes('share')) {
        await expect(page.getByText(`Include on roster: ${fieldsConfig.share.options.map(opt => opt.value).join(', ')}`)).toBeVisible();
      }
    });

    test('shows correct summary after adding all fields', async ({ page }) => {
      const person = personWithAllFields;

      await addPerson(page, person);
      await page.getByRole('button', { name: 'Person One' }).click();

      // await expect(page.locator('text=Pronouns: they/them')).toBeVisible();
      await expect(page.getByText('Name for Roster: Person One')).toBeVisible();
      await expect(page.getByText('Email: ' + person.email)).toBeVisible();
      await expect(page.getByText('Phone: ' + person.phone)).toBeVisible();
      await expect(page.getByText('Address: ' + person.address + ' ' + person.apartment +  ', ' + person.city + ', ' + person.state + ' ' + person.zip)).toBeVisible();
      await expect(page.getByText(`Include on roster: ${fieldsConfig.share.options.map(opt => opt.value).join(', ')}`)).toBeVisible();
      await expect(page.getByText('Allergies: mold')).toBeVisible();
      await expect(page.getByText('Transportation: I can offer a ride to camp, I can offer a place to stay in the Bay Area before or after camp')).toBeVisible();
      await expect(page.getByText('Bedding: I can offer bedding and a towel to a camper from out of town')).toBeVisible();
      await expect(page.getByText('Volunteering: I can come early to help with camp set up, I can stay late to help with camp take down')).toBeVisible();
      await expect(page.getByText('Housing: I have a floor.')).toBeVisible();
      await expect(page.getByText('Roommate: no snoring please')).toBeVisible();
      await expect(page.getByText('Do any of these apply?: I am interested in a beginner\'s lesson')).toBeVisible();
      await expect(page.getByText('Comments: Yay dancing!')).toBeVisible();
    });

    test('shows pronouns in nametag when enabled in config', async ({ page }) => {
      test.skip(!fields.includes('pronouns'), 'Nametag pronouns not enabled in config');
      test.skip(!fields.includes('nametag'), 'Nametag field disabled in config');
      test.skip(!config.nametags.includePronouns, 'Nametag pronoun inclusion not enabled in config');

      const expectedNametag = config.nametags.includeLastName ? 'Person One (they/them)' : 'Person (they/them)';

      await addPerson(page, { ...person1, pronouns: 'they/them' });
      await page.getByRole('button', { name: 'Person One' }).click();
      await expect(page.getByText('Name for roster: ' + expectedNametag)).toBeVisible();
    });

    test('show details for multiple people', async ({ page }) => {
      // add person 1
      await addPerson(page, person1);
      await page.getByRole('button', { name: BUTTON_TEXT.ADD_ANOTHER_PERSON }).click();

      // add person 2 with different shared options
      await fillFields(page, person2, 1);
      const shareNameOption = page.locator(getOptionSelector('share', 'name', 1));
      const shareEmailOption = page.locator(getOptionSelector('share', 'email', 1));
      await shareNameOption.uncheck();
      await shareNameOption.check();
      await shareEmailOption.check();
      await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();

      await page.getByRole('button', { name: 'Person One' }).click();
      await expect(page.getByText('Name for Roster: Person One')).toBeVisible();

      await page.getByRole('button', { name: 'Person Two' }).click();
      await expect(page.getByText('Name for Roster: Person Two')).toBeVisible();

      await expect(page.getByText('Name for Roster: Person One')).toBeVisible();
      await expect(page.getByText('Email: ' + person1.email)).toBeVisible();
      await expect(page.getByText('Phone: ' + person1.phone)).toBeVisible();
      await expect(page.getByText('Address: ' + person1.address + ', ' + person1.city + ', ' + person1.state + ' ' + person1.zip)).toBeVisible();
      await expect(page.getByText('Include on roster: name, pronouns, email, phone, address')).toBeVisible();

      await expect(page.getByText('Name for Roster: Person Two')).toBeVisible();
      await expect(page.getByText('Email: ' + person2.email)).toBeVisible();
      await expect(page.getByText('Phone: ' + person2.phone)).toBeVisible();
      await expect(page.getByText('Address: ' + person2.address + ', ' + person2.city + ', ' + person2.state + ' ' + person2.zip)).toBeVisible();
      await expect(page.getByText('Include on roster: name, email')).toBeVisible();
    });

    test.describe('misc checkboxes', () => {
      test.skip(!fields.includes('misc'), 'No misc field in config');

      test('include minor age in summary', async ({ page }) => {
        test.skip(!fieldsConfig.misc.options.map(o => o.value).includes('minor'), 'No minor option in misc field');

        await fillFields(page, person1);

        const minorOption = page.locator(getOptionSelector('misc', 'minor'));
        await minorOption.check();

        await page.fill(getTextareaSelector('miscComments'), '15 years old');

        await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();
        await page.getByRole('button', { name: person1.first + ' ' + person1.last }).click();
        await expect(page.getByText(`Do any of these apply?: I am a minor (15 years old)`)).toBeVisible();
      });

      test('include beginner interest in summary', async ({ page }) => {
        test.skip(!fieldsConfig.misc.options.map(o => o.value).includes('beginner'), 'No beginner option in misc field');

        await fillFields(page, person1);

        const beginnerOption = page.locator(getOptionSelector('misc', 'beginner'));
        await beginnerOption.check();

        await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();
        await page.getByRole('button', { name: person1.first + ' ' + person1.last }).click();
        await expect(page.getByText('Do any of these apply?: I am interested in a beginner\'s lesson')).toBeVisible();
      });

      test('include no-photos preference in summary', async ({ page }) => {
        test.skip(!fieldsConfig.misc.options.map(o => o.value).includes('no-photos'), 'No no-photos option in misc field');

        await fillFields(page, person1);

        const noPhotosOption = page.locator(getOptionSelector('misc', 'no-photos'));
        await noPhotosOption.check();

        await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();
        await page.getByRole('button', { name: person1.first + ' ' + person1.last }).click();
        await expect(page.getByText('Do any of these apply?: No photos')).toBeVisible();
      });

      // brittle test, hardcoded to specific config
      test('include all misc options in summary', async ({ page }) => {
        await fillFields(page, person1);

        const minorOption = page.locator(getOptionSelector('misc', 'minor'));
        await minorOption.check();
        await page.fill(getTextareaSelector('miscComments'), '16 years old');

        const beginnerOption = page.locator(getOptionSelector('misc', 'beginner'));
        await beginnerOption.check();

        const noPhotosOption = page.locator(getOptionSelector('misc', 'no-photos'));
        await noPhotosOption.check();

        await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();
        await page.getByRole('button', { name: person1.first + ' ' + person1.last }).click();
        await expect(page.getByText(`Do any of these apply?: I am a minor (16 years old), No photos, I am interested in a beginner's lesson`)).toBeVisible();
      });
    });
  });

  test.describe('editing and deleting people', () => {
    test('edits a person and retains data', async ({ page }) => {
      await addPerson(page, { ...person1, first: 'Person', last: 'One', phone: '503-555-1212' });

      await page.getByRole('button', { name: 'Person One' }).click();
      await page.getByRole('button', { name: BUTTON_TEXT.EDIT }).click();

      await fillField(page, 'first', 'Updated');
      await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();

      await expect(page.getByRole('button', { name: 'Updated One' })).toBeVisible();
      await page.getByRole('button', { name: 'Updated One' }).click();
      await expect(page.getByText('Phone: 503-555-1212')).toBeVisible();
    });

    test('edits a second person without affecting the first', async ({ page }) => {
      await addPeople(page, [person1, person2]);

      await page.getByRole('button', { name: 'Person Two' }).click();
      await page.getByRole('button', { name: 'Person Two' })
        .locator('..')
        .getByRole('button', { name: BUTTON_TEXT.EDIT })
        .click();

      await fillField(page, 'first', 'SecondUpdated', 1);
      await page.getByRole('button', { name: BUTTON_TEXT.SAVE }).click();

      await expect(page.getByRole('button', { name: 'SecondUpdated Two' })).toBeVisible();
      await page.getByRole('button', { name: 'Person One' }).click();
      await expect(page.getByText('Name for Roster: Person One')).toBeVisible();
    });

    test('canceling edits to a person retains original data', async ({ page }) => {
      await addPerson(page, person1);

      await page.getByRole('button', { name: 'Person One' }).click();
      await page.getByRole('button', { name: BUTTON_TEXT.EDIT }).click();

      await fillField(page, 'first', 'CanceledUpdate');
      await page.getByRole('button', { name: BUTTON_TEXT.CANCEL }).click();

      await expect(page.getByRole('button', { name: 'Person One' })).toBeVisible();
    });

    test('deletes a person', async ({ page }) => {
      page.on('dialog', dialog => dialog.accept());

      await addPerson(page, person1);

      await page.getByRole('button', { name: 'Person One' }).click();
      await page.getByRole('button', { name: BUTTON_TEXT.DELETE }).click();

      // shows form again after deleting the only person
      await expect(page.getByRole('button', { name: 'Person One' })).not.toBeVisible();
      await expect(page.locator(getFieldSelector('first'))).toBeVisible();
    });

    test('deletes a second person', async ({ page }) => {
      page.on('dialog', dialog => dialog.accept());

      await addPeople(page, [person1, person2]);

      await page.getByRole('button', { name: 'Person One' }).click();
      await page.getByRole('button', { name: BUTTON_TEXT.DELETE }).click();

      await expect(page.getByRole('button', { name: 'Person One' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Person Two' })).toBeVisible();

      // transfers agreement to remaining person if applicable
      if (fields.includes('agreement')) {
        await page.getByRole('button', { name: BUTTON_TEXT.EDIT }).click();
        await expect(page.locator(getOptionSelector('agreement', 'yes'))).toBeChecked();
      }
    });

    test('deleting a person prompts for confirmation', async ({ page }) => {
      page.on('dialog', dialog => dialog.dismiss());

      await addPerson(page, person1);

      await page.getByRole('button', { name: 'Person One' }).click();
      await page.getByRole('button', { name: BUTTON_TEXT.DELETE }).click();

      // person should still be present after dismissing dialog
      await expect(page.getByRole('button', { name: 'Person One' })).toBeVisible();
    });
  });

  test.describe('navigation and data persistence', () => {
    test('continues to page 2 after successful submission', async ({ page }) => {
      await addPerson(page, person1);
      await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
      await expect(page).toHaveURL(/\/payment$/);
    });

    test('retains data after navigating away and back', async ({ page }) => {
      await addPerson(page, person1);
      await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
      await expect(page).toHaveURL(/\/payment$/);

      // Navigate back to form
      await page.goBack();
      await expect(page).toHaveURL(/\/(registration|)$/);

      // Verify data is still present
      await expect(page.getByRole('button', { name: 'Person One' })).toBeVisible();

      // Proceed again to payment page
      await page.getByRole('button', { name: BUTTON_TEXT.NEXT }).click();
      await expect(page).toHaveURL(/\/payment$/);

      // Navigate with form back button
      await page.getByRole('button', { name: BUTTON_TEXT.BACK }).click();
      await expect(page).toHaveURL(/\/(registration|)$/);

      await expect(page.getByRole('button', { name: 'Person One' })).toBeVisible();
    });

    test('retains data after page reload', async ({ page }) => {
      await addPerson(page, person1);
      await page.reload();
      
      // Verify data is still present
      await expect(page.getByRole('button', { name: 'Person One' })).toBeVisible();
    });
  });

  // test check people threshold separately so can run tests that involve backend synchronously
});
